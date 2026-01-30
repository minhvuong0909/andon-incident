using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using DotNetEnv;

namespace EspFlasher
{
    public class FirmwareCrypto
    {
        public static void EncryptFirmware(string binFile, string encFile)
        {
            Env.Load();

            using Aes aes = Aes.Create();
            //aes.Key = KEY;
            //aes.IV = IV;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;

            using FileStream input = File.OpenRead(binFile);
            using FileStream output = File.Create(encFile);

            using CryptoStream crypto =
                new CryptoStream(output, aes.CreateEncryptor(), CryptoStreamMode.Write);

            input.CopyTo(crypto);
            crypto.FlushFinalBlock();
        }
    }
}
