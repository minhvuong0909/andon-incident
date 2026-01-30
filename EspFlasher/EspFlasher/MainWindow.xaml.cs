using System.Diagnostics;
using System.IO;
using System.IO.Ports;
using System.Security.Cryptography;
using System.Text;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;
using Microsoft.Win32;
using DotNetEnv;

namespace EspFlasher
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();
        }
        CreateConveyor conveyor = new();
        private void BtnBrowse_Click(object sender, RoutedEventArgs e)
        {
            OpenFileDialog ofd = new OpenFileDialog
            {
                Filter = "Encrypted Firmware (*.enc)|*.enc",
                Title = "Select encrypted firmware"
            };

            if (ofd.ShowDialog() == true)
            {
                TxtFirmware.Text = ofd.FileName;
            }
        }

        private void BtnScan_Click(object sender, RoutedEventArgs e)
        {
            LstComPorts.Items.Clear();

            string[] ports = SerialPort.GetPortNames()
                                       .OrderBy(p => p)
                                       .ToArray();

            foreach (string port in ports)
            {
                LstComPorts.Items.Add(port);
            }

            Log($"Found {ports.Length} COM port(s)");
        }

        // FLASH button
        private async void BtnFlash_Click(object sender, RoutedEventArgs e)
        {
            string encFile = TxtFirmware.Text;
            string tempBin = System.IO.Path.Combine(System.IO.Path.GetTempPath(), "firmware_temp.bin");
            Env.Load();
            byte[] key = Encoding.UTF8.GetBytes(Environment.GetEnvironmentVariable("SECRET_KEY")); // 16 bytes
            byte[] iv = Encoding.UTF8.GetBytes(Environment.GetEnvironmentVariable("IV_KEY")); // 16 bytes

            

            if (!File.Exists(TxtFirmware.Text))
            {
                MessageBox.Show("Firmware file not found!", "Error",
                    MessageBoxButton.OK, MessageBoxImage.Error);
                return;
            }

            if (LstComPorts.SelectedItems.Count == 0)
            {
                MessageBox.Show("Please select at least one COM port!", "Error",
                    MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            BtnFlash.IsEnabled = false;
            foreach (var item in LstComPorts.SelectedItems)
            {
                string com = item.ToString();
                await FlashOneAsync(com, TxtFirmware.Text);
                // decrypt first
                DecryptBin(encFile, tempBin, key, iv);

                // flash temp bin
                await FlashOneAsync(com, tempBin);

                // delete temp file
                File.Delete(tempBin);
            }

            BtnFlash.IsEnabled = true;
            Log("ALL DONE");
            conveyor.ShowDialog();
        }

        // Flash one ESP (sequential – stable)
        private Task FlashOneAsync(string com, string firmware)
        {
            return Task.Run(() =>
            {
                Log($"[{com}] Flashing...");

                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = "esptool.exe",
                    Arguments = $"--port {com} --baud 115200 write_flash 0x00000 \"{firmware}\"",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true
                };

                try
                {
                    using (Process p = Process.Start(psi))
                    {
                        string stdout = p.StandardOutput.ReadToEnd();
                        string stderr = p.StandardError.ReadToEnd();
                        p.WaitForExit();

                        if (p.ExitCode == 0)
                        {
                            Log($"[{com}] SUCCESS");
                            string deviceId = GetDeviceId(com);

                            if (!string.IsNullOrEmpty(deviceId))
                                Log($"[{com}] Device ID: {deviceId}");

                            conveyor.ConveyorInfo = deviceId;
                            conveyor.ShowDialog();
                        }
                        else
                        {
                            Log($"[{com}] FAIL");
                            if (!string.IsNullOrWhiteSpace(stderr))
                                Log(stderr);
                        }
                    }
                }
                catch (Exception ex)
                {
                    Log($"[{com}] ERROR: {ex.Message}");
                }
            });
        }
        // Thread-safe log
        private void Log(string message)
        {
            Dispatcher.Invoke(() =>
            {
                TxtLog.AppendText(
                    $"[{DateTime.Now:HH:mm:ss}] {message}{Environment.NewLine}");
                TxtLog.ScrollToEnd();
            });
        }
        // get device ID when successfully flashed
        private string GetDeviceId(string com)
        {
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = "esptool.exe",
                    Arguments = $"--port {com} chip_id",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true
                };

                using (Process p = Process.Start(psi))
                {
                    string output = p.StandardOutput.ReadToEnd();
                    p.WaitForExit();

                    // Find Chip ID line
                    foreach (string line in output.Split('\n'))
                    {
                        if (line.Contains("Chip ID"))
                        {
                            // split
                            string hex = line.Split(':')[1].Trim();

                            hex = hex.Replace("0x", "");

                            // convert chip id
                            uint chipIdDecimal = Convert.ToUInt32(hex, 16);
                            string result = "esp8266_" + chipIdDecimal;
                            return result;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Log($"[{com}] Cannot read Device ID: {ex.Message}");
            }

            return null;
        }
        // AES Encrypt file
        public static void EncryptFile(string input, string output, byte[] key, byte[] iv)
        {
            using var aes = Aes.Create();
            aes.Key = key;
            aes.IV = iv;

            using var inStream = File.OpenRead(input);
            using var outStream = File.Create(output);

            using var crypto = new CryptoStream(outStream, aes.CreateEncryptor(), CryptoStreamMode.Write);

            inStream.CopyTo(crypto);
        }

        public static void EncryptBin(string inputBin, string outputEnc, byte[] key, byte[] iv)
        {


            using Aes aes = Aes.Create();
            aes.Key = key;
            aes.IV = iv;

            using FileStream input = File.OpenRead(inputBin);
            using FileStream output = File.Create(outputEnc);

            using CryptoStream crypto = new CryptoStream(output, aes.CreateEncryptor(), CryptoStreamMode.Write);

            input.CopyTo(crypto);
        }

        public static void DecryptBin(string inputEnc, string outputBin, byte[] key, byte[] iv)
        {
            using Aes aes = Aes.Create();
            aes.Key = key;
            aes.IV = iv;

            using FileStream input = File.OpenRead(inputEnc);
            using FileStream output = File.Create(outputBin);

            using CryptoStream crypto = new CryptoStream(input, aes.CreateDecryptor(), CryptoStreamMode.Read);

            crypto.CopyTo(output);
        }

        private void Window_Loaded(object sender, RoutedEventArgs e)
        {
            Env.Load();
            Log("Env variables loaded.");

            
        }   
    }
}