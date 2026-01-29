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
        private void BtnCreate_Click(object sender, RoutedEventArgs e)
        {
            //    try
            //    {
            //        int factoryId = int.Parse(TxtFactoryId.Text);
            //        string name = TxtConveyorName.Text;
            //        string deviceId = CmbDeviceId.SelectedItem.ToString();

            //        var api = new FactoryService();

            //        var req = new CreateConveyorRequest
            //        {
            //            factory_id = factoryId,
            //            name = name,
            //            device_id = deviceId
            //        };

            //        bool ok = await api.CreateConveyorAsync(req);

            //        if (ok)
            //        {
            //            MessageBox.Show("✅ Conveyor created successfully!");
            //            this.Close();
            //        }
            //    }
            //    catch (Exception ex)
            //    {
            //        MessageBox.Show("Error: " + ex.Message);
            //    }
        }

        // factory combobox fill
        //public void FillComboBox()
        //{
        //    FactoryComboBox.ItemsSource = _conveyorService.GetAllFactories();
        //    FactoryComboBox.DisplayMemberPath = "Name";
        //    FactoryComboBox.SelectedValuePath = "Id";
        //}

        private void Window_Loaded(object sender, RoutedEventArgs e)
        {
            //    FillComboBox();
            FactoryComboBox.ItemsSource = _conveyorService.GetAllFactories();
            FactoryComboBox.DisplayMemberPath = "Name";
            //FactoryComboBox.SelectedValuePath = "Id";
        }
    }
}
