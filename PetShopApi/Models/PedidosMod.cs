namespace PetShopApi.Models
{
    public class AgregarCarritoRequest
    {
        public int UsuarioID { get; set; }
        public int ProductoID { get; set; }
        public int Cantidad { get; set; }
    }
    // En tu carpeta Models
    public class PedidosMod
    {
        public int PedidoID { get; set; }
        public decimal Total { get; set; }
        public List<DetallePedidosMod> Detalles { get; set; } = new List<DetallePedidosMod>();
    }

    public class DetallePedidosMod
    {
        public int DetalleID { get; set; }
        public int ProductoID { get; set; }
        public string NombreProducto { get; set; } = string.Empty;
        public int Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
    }
}
