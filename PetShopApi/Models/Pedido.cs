namespace PetShopApi.Models
{
    public class Pedido
    {
        public int UsuarioId { get; set; }
        public string? ClienteEmail { get; set; } // O ID del usuario
        public decimal Total { get; set; }
        public DateTime Fecha { get; set; } = DateTime.Now;
        public List<DetallePedidoModel>? Items { get; set; }
    }

    public class DetallePedidoModel
    {
        public int ProductoId { get; set; }
        public int Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
    }
}
