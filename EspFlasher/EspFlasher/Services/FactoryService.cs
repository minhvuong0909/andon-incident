using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using EspFlasher.DAL.Repos;
using EspFlasher.Entities;

namespace EspFlasher.Services
{
    public class FactoryService
    {
        private readonly HttpClient _httpClient;
        private FactoryRepo _factoryRepo = new();

        public List<Factory> GetAllFactories()
        {
            return _factoryRepo.GetAllFactories();
        }

        public FactoryService()
        {
            _httpClient = new HttpClient();
        }

        //public async Task<bool> CreateConveyorAsync(CreateConveyorRequest req)
        //{
        //    string url = "http://localhost:4000/conveyor/create";

        //    HttpResponseMessage res =
        //        await _httpClient.PostAsJsonAsync(url, req);

        //    if (res.IsSuccessStatusCode)
        //        return true;

        //    string error = await res.Content.ReadAsStringAsync();
        //    //MessageBox.Show("API Error: " + error);

        //    return false;
        //}
    }
}
