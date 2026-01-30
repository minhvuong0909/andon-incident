using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;
using EspFlasher.Dtos;
using EspFlasher.Entities;
using EspFlasher.Services;

namespace EspFlasher
{
    /// <summary>
    /// Interaction logic for CreateConveyor.xaml
    /// </summary>
    public partial class CreateConveyor : Window
    {
        
        public CreateConveyor()
        {
            InitializeComponent();
        }
       
        private FactoryService _conveyorService = new FactoryService();
        public string ConveyorInfo { get; set; }
        private async void BtnCreate_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                int factoryId = (int)FactoryComboBox.SelectedValue;
                string name = TxtConveyorName.Text;
                string deviceId = TxtDeviceId.Text;

                var api = new FactoryService();

                var req = new CreateConveyorRequest
                {
                    factory_id = factoryId,
                    name = name,
                    device_id = deviceId
                };

                bool ok = await api.CreateConveyorAsync(req);

                if (ok)
                {
                    MessageBox.Show("✅ Conveyor created successfully!");
                    this.Close();
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Error: " + ex.Message);
            }
        }

        private void Window_Loaded(object sender, RoutedEventArgs e)
        {
            //    FillComboBox();
            FactoryComboBox.ItemsSource = _conveyorService.GetAllFactories();
            FactoryComboBox.DisplayMemberPath = "Name";
            FactoryComboBox.SelectedValuePath = "Id";
            TxtDeviceId.Text = ConveyorInfo;
        }
    }
}
