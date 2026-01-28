using System.Diagnostics;
using System.IO;
using System.IO.Ports;
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

        private void BtnBrowse_Click(object sender, RoutedEventArgs e)
        {
            OpenFileDialog ofd = new OpenFileDialog
            {
                Filter = "Firmware (*.bin)|*.bin",
                Title = "Select firmware"
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
            }

            BtnFlash.IsEnabled = true;
            Log("ALL DONE");
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

    }
}