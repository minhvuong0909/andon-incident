using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;

class Program
{
    // ✅ Key bí mật (AES-256 = 32 bytes)
    static readonly byte[] KEY =
        Encoding.UTF8.GetBytes("12345678901234567890123456789012");

    // ✅ IV (16 bytes)
    static readonly byte[] IV =
        Encoding.UTF8.GetBytes("abcdefghijklmnop");

    static void Main()
    {
        Console.WriteLine("=== BIN → ENC Encrypt Tool ===\n");

        // ✅ Ask user input file path
        Console.Write("Enter BIN file path: ");
        string binFile = Console.ReadLine();

        // ✅ Remove quotes if user paste full path
        binFile = binFile.Trim().Replace("\"", "");

        // ✅ Check file exists
        if (!File.Exists(binFile))
        {
            Console.WriteLine("\n❌ File not found!");
            return;
        }

        try
        {
            // ✅ Encrypt BIN → ENC
            string encFile = EncryptBin(binFile);

            Console.WriteLine("\n✅ Encrypt SUCCESS!");
            Console.WriteLine("Encrypted file created:");
            Console.WriteLine(encFile);
        }
        catch (Exception ex)
        {
            Console.WriteLine("\n❌ Encrypt FAILED:");
            Console.WriteLine(ex.Message);
        }

        Console.WriteLine("\nPress any key to exit...");
        Console.ReadKey();
    }

    // ✅ Encrypt firmware.bin → firmware.enc
    static string EncryptBin(string binPath)
    {
        // output same folder
        string encPath = Path.ChangeExtension(binPath, ".enc");

        using Aes aes = Aes.Create();
        aes.Key = KEY;
        aes.IV = IV;
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;

        using FileStream input = File.OpenRead(binPath);
        using FileStream output = File.Create(encPath);

        using CryptoStream crypto =
            new CryptoStream(output, aes.CreateEncryptor(), CryptoStreamMode.Write);

        input.CopyTo(crypto);
        crypto.FlushFinalBlock();

        return encPath;
    }
}
