using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Configuration.Json;
using System;
using System.IO;

public static class AppConfig
{
    public static IConfigurationRoot Config { get; private set; }

    static AppConfig()
    {
        try
        {
            var basePath = AppDomain.CurrentDomain.BaseDirectory;
            var configPath = Path.Combine(basePath, "appsettings.json");

            if (!File.Exists(configPath))
            {
                throw new FileNotFoundException(
                    $"appsettings.json not found at: {configPath}\n" +
                    $"Base path: {basePath}");
            }

            Config = new ConfigurationBuilder()
                .SetBasePath(basePath)
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                .Build();
        }
        catch (Exception ex)
        {
            throw new Exception("Cannot load appsettings.json. " +
                                "Make sure it exists in output folder!\n\n" +
                                ex.Message, ex);
        }
    }
}
