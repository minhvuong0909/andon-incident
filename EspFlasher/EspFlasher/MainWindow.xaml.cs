using System;
using System.Diagnostics;
using System.IO;
using System.IO.Ports;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using Microsoft.Win32;

namespace EspFlasher
{
    public partial class MainWindow : Window
    {
        CreateConveyor conveyor = new();

        public MainWindow()
        {
            InitializeComponent();
        }

        // ============================
        //  Browse encrypted firmware
        // ============================
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

        // ============================
        // ✅ Scan COM Ports
        // ============================
        private void BtnScan_Click(object sender, RoutedEventArgs e)
        {
            LstComPorts.Items.Clear();

            string[] ports = SerialPort.GetPortNames();

            foreach (string port in ports)
                LstComPorts.Items.Add(port);

            Log($"Found {ports.Length} COM port(s)");
        }

        // ============================
        // ✅ FLASH BUTTON
        // ============================
        private async void BtnFlash_Click(object sender, RoutedEventArgs e)
        {
            string encFile = TxtFirmware.Text;

            // ✅ Check firmware file
            if (!File.Exists(encFile))
            {
                MessageBox.Show("Firmware file not found!");
                return;
            }

            // ✅ Check COM selected
            if (LstComPorts.SelectedItems.Count == 0)
            {
                MessageBox.Show("Select at least one COM port!");
                return;
            }

            // key 
            string keyStr = AppConfig.Config["Crypto:SECRET_KEY"];
            string ivStr = AppConfig.Config["Crypto:IV_KEY"];

            if (string.IsNullOrEmpty(keyStr) || string.IsNullOrEmpty(ivStr))
            {
                MessageBox.Show("SECRET_KEY or IV_KEY not found in appsettings.json!\n\n" +
                    "Please add:\n" +
                    "\"Crypto\": {\n" +
                    "  \"SECRET_KEY\": \"your-16-char-key\",\n" +
                    "  \"IV_KEY\": \"your-16-char-iv\"\n" +
                    "}");
                return;
            }

            byte[] key = Encoding.UTF8.GetBytes(keyStr);
            byte[] iv = Encoding.UTF8.GetBytes(ivStr);

            // ✅ Validate AES key length (16 for AES-128, 24 for AES-192, 32 for AES-256)
            if (key.Length != 16 && key.Length != 24 && key.Length != 32)
            {
                MessageBox.Show($"SECRET_KEY must be 16, 24, or 32 bytes!\n\n" +
                    $"Current length: {key.Length} bytes\n" +
                    $"Your key: {keyStr.Length} characters\n\n" +
                    $"Common sizes:\n" +
                    $"• 16 bytes = AES-128\n" +
                    $"• 24 bytes = AES-192\n" +
                    $"• 32 bytes = AES-256");
                return;
            }

            // ✅ Validate IV length (always 16 bytes for AES)
            if (iv.Length != 16)
            {
                MessageBox.Show($"IV_KEY must be exactly 16 bytes!\n\n" +
                    $"Current length: {iv.Length} bytes\n" +
                    $"Your IV: {ivStr.Length} characters\n\n" +
                    $"Please use a 16-character string in appsettings.json");
                return;
            }

            // ✅ Temp BIN file unique
            string tempBin = Path.Combine(
                Path.GetTempPath(),
                $"fw_{Guid.NewGuid():N}.bin"
            );

            try
            {
                BtnFlash.IsEnabled = false;

                Log("Decrypting firmware...");
                Log($"Encryption mode: AES-{key.Length * 8} (Key: {key.Length} bytes, IV: {iv.Length} bytes)");
                Log($"Encrypted file size: {new FileInfo(encFile).Length} bytes");

                // ✅ Decrypt ONCE with proper error handling
                bool decryptSuccess = DecryptBin(encFile, tempBin, key, iv);

                if (!decryptSuccess)
                {
                    MessageBox.Show(
                        "Decryption failed!\n\n" +
                        "Possible reasons:\n" +
                        "1. Wrong SECRET_KEY or IV_KEY\n" +
                        "2. File was encrypted with different key\n" +
                        "3. Corrupted .enc file\n\n" +
                        "Please verify your encryption key matches the one used to create the .enc file.",
                        "Decryption Error",
                        MessageBoxButton.OK,
                        MessageBoxImage.Error);
                    return;
                }

                Log($"Decrypt SUCCESS. Output size: {new FileInfo(tempBin).Length} bytes");
                Log("Start flashing...");

                // ✅ Flash each selected COM
                foreach (var item in LstComPorts.SelectedItems)
                {
                    string com = item.ToString();
                    await FlashOneAsync(com, tempBin);
                }

                Log("✅ ALL DEVICES FLASHED DONE!");

                // ✅ Show conveyor dialog ONCE after flashing
                conveyor.ShowDialog();
            }
            catch (CryptographicException ex)
            {
                MessageBox.Show(
                    $"Decryption Error: {ex.Message}\n\n" +
                    "This usually means:\n" +
                    "• Wrong encryption key (SECRET_KEY or IV_KEY)\n" +
                    "• File encrypted with different algorithm\n" +
                    "• Corrupted .enc file",
                    "Crypto Error",
                    MessageBoxButton.OK,
                    MessageBoxImage.Error);
                Log($"❌ Crypto Error: {ex.Message}");
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Flash Error: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
                Log($"❌ Error: {ex.Message}");
            }
            finally
            {
                BtnFlash.IsEnabled = true;

                // ✅ Delete temp bin
                if (File.Exists(tempBin))
                {
                    try
                    {
                        File.Delete(tempBin);
                        Log("Temp file cleaned up");
                    }
                    catch (Exception ex)
                    {
                        Log($"Warning: Could not delete temp file: {ex.Message}");
                    }
                }
            }
        }

        // ============================
        // ✅ Flash One ESP Device
        // ============================
        private Task FlashOneAsync(string com, string firmwareBin)
        {
            return Task.Run(() =>
            {
                Log($"[{com}] Flashing...");

                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = "esptool.exe",
                    //Arguments = $"--port {com} --baud 921600 write_flash 0x00000 \"{firmwareBin}\"",
                    Arguments = $"--port {com} --baud 115200 write_flash -z 0x0 \"{firmwareBin}\"",
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
                            Log($"[{com}] ✅ SUCCESS");

                            // ✅ Read device ID
                            string deviceId = GetDeviceId(com);

                            if (!string.IsNullOrEmpty(deviceId))
                            {
                                Log($"[{com}] Device ID = {deviceId}");

                                // ✅ Update UI safely
                                Dispatcher.Invoke(() =>
                                {
                                    conveyor.ConveyorInfo = deviceId;
                                });
                            }
                        }
                        else
                        {
                            Log($"[{com}] ❌ FAIL (Exit code: {p.ExitCode})");
                            if (!string.IsNullOrEmpty(stderr))
                                Log($"[{com}] Error: {stderr}");
                        }
                    }
                }
                catch (Exception ex)
                {
                    Log($"[{com}] ERROR: {ex.Message}");
                }
            });
        }

        // ============================
        // ✅ Get ESP Chip ID → esp8266_xxxx
        // ============================
        private string GetDeviceId(string com)
        {
            try
            {
                // First detect chip type
                ProcessStartInfo detectPsi = new ProcessStartInfo
                {
                    FileName = "esptool.exe",
                    Arguments = $"--port {com} chip_id",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true
                };

                string detectOutput;

                using (Process p = Process.Start(detectPsi))
                {
                    detectOutput = p.StandardOutput.ReadToEnd();
                    p.WaitForExit();
                }

                if (detectOutput.Contains("ESP8266"))
                {
                    return GetEsp8266Id(detectOutput);
                }
                else if (detectOutput.Contains("ESP32"))
                {
                    return GetEsp32Mac(com);
                }
                else
                {
                    Log($"[{com}] Unknown chip type");
                }
            }
            catch (Exception ex)
            {
                Log($"[{com}] Failed to get device ID: {ex.Message}");
            }

            return null;
        }
        private string GetEsp8266Id(string output)
        {
            foreach (string line in output.Split('\n'))
            {
                if (line.Contains("Chip ID"))
                {
                    string hex = line.Split(':')[1].Trim().Replace("0x", "");
                    uint chipIdDecimal = Convert.ToUInt32(hex, 16);
                    return "esp8266_" + chipIdDecimal;
                }
            }
            return null;
        }

        private string GetEsp32Mac(string com)
        {
            ProcessStartInfo psi = new ProcessStartInfo
            {
                FileName = "esptool.exe",
                Arguments = $"--port {com} read_mac",
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true
            };

            using (Process p = Process.Start(psi))
            {
                string output = p.StandardOutput.ReadToEnd();
                p.WaitForExit();

                foreach (string line in output.Split('\n'))
                {
                    if (line.Contains("MAC:"))
                    {
                        string mac = line.Substring(line.IndexOf("MAC:") + 4).Trim();
                        mac = mac.Replace(":", "").ToLower();

                        if (mac.Length == 12)
                        {
                            mac =
                                mac.Substring(10, 2) +
                                mac.Substring(8, 2) +
                                mac.Substring(6, 2) +
                                mac.Substring(4, 2) +
                                mac.Substring(2, 2) +
                                mac.Substring(0, 2);
                        }

                        return "esp32_" + mac;
                    }
                }
            }

            return null;
        }
        // ============================
        // ✅ AES Decrypt ENC → BIN (Fixed with better error handling)
        // ============================
        public static bool DecryptBin(string inputEnc, string outputBin, byte[] key, byte[] iv)
        {
            try
            {
                // Validate input file
                if (!File.Exists(inputEnc))
                {
                    throw new FileNotFoundException($"Encrypted file not found: {inputEnc}");
                }

                // Read encrypted data
                byte[] encryptedData = File.ReadAllBytes(inputEnc);

                if (encryptedData.Length == 0)
                {
                    throw new InvalidDataException("Encrypted file is empty!");
                }

                // Verify the file size is valid for AES (must be multiple of 16)
                if (encryptedData.Length % 16 != 0)
                {
                    throw new InvalidDataException(
                        $"Invalid encrypted file size: {encryptedData.Length} bytes. " +
                        "AES-encrypted data must be a multiple of 16 bytes.");
                }

                using (Aes aes = Aes.Create())
                {
                    aes.Key = key;
                    aes.IV = iv;
                    aes.Mode = CipherMode.CBC;
                    aes.Padding = PaddingMode.PKCS7;

                    using (FileStream input = new FileStream(inputEnc, FileMode.Open, FileAccess.Read))
                    using (FileStream output = new FileStream(outputBin, FileMode.Create, FileAccess.Write))
                    using (CryptoStream crypto = new CryptoStream(input, aes.CreateDecryptor(), CryptoStreamMode.Read))
                    {
                        crypto.CopyTo(output);
                    }
                }

                // Verify output was created
                if (!File.Exists(outputBin) || new FileInfo(outputBin).Length == 0)
                {
                    throw new InvalidOperationException("Decryption produced empty output");
                }

                return true;
            }
            catch (CryptographicException ex)
            {
                // This is the "Padding is invalid" error
                throw new CryptographicException(
                    "Decryption failed - wrong key or corrupted file.\n\n" +
                    "Make sure:\n" +
                    "1. SECRET_KEY matches the key used for encryption\n" +
                    "2. IV_KEY matches the IV used for encryption\n" +
                    "3. The .enc file is not corrupted\n\n" +
                    $"Technical error: {ex.Message}",
                    ex);
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to decrypt firmware: {ex.Message}", ex);
            }
        }

        // ============================
        // ✅ Thread-safe Log
        // ============================
        private void Log(string message)
        {
            Dispatcher.Invoke(() =>
            {
                TxtLog.AppendText($"[{DateTime.Now:HH:mm:ss}] {message}\n");
                TxtLog.ScrollToEnd();
            });
        }

        private void Button_Click(object sender, RoutedEventArgs e)
        {
            Application.Current.Shutdown();
        }

        private void Button_Click_1(object sender, RoutedEventArgs e)
        {
            TxtLog.Clear();
        }
    }
}

