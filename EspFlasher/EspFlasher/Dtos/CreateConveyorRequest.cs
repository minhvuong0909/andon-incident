using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EspFlasher.Dtos
{
    public class CreateConveyorRequest
    {
        public string device_id { get; set; } = "";
        public int factory_id { get; set; }
        public string name { get; set; } = "";
    }
}
