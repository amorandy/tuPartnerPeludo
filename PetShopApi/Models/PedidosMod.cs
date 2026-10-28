namespace PetShopApi.Models
{
    public class AgregarCarritoRequest
    {
        public int UsuarioID { get; set; }
        public int ProductoID { get; set; }
        public int Cantidad { get; set; }
    }

    public class PedidosMod
    {
        public int PedidoID { get; set; }
        public decimal Total { get; set; }

        // Nuevos campos para el panel de administración
        public string Estado { get; set; } = string.Empty;
        public DateTime Fecha { get; set; }
        public string ClienteNombre { get; set; } = string.Empty;
        public string ClienteEmail { get; set; } = string.Empty;
        public string MetodoPago { get; set; } = string.Empty;
        public string Alias { get; set; } = string.Empty;
        public string DireccionCompleta { get; set; } = string.Empty;
        public string Referencias { get; set; } = string.Empty;

        public List<DetallePedidosMod> Detalles { get; set; } = new List<DetallePedidosMod>();
    }

    public class DetallePedidosMod
    {
        public int DetalleID { get; set; }
        public int ProductoID { get; set; }

        // Renombrado para que coincida exactamente con el JS (item.productoNombre)
        public string ProductoNombre { get; set; } = string.Empty;

        public int Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
    }
    public class ActualizarEstadoRequest
    {
        public int PedidoID { get; set; }
        public string Estado { get; set; } = string.Empty;
    }
    public class ActualizarCantidadRequest
    {
        public int DetalleID { get; set; }
        public int Cantidad { get; set; }
    }
    public class CheckoutRequest
    {
        public int UsuarioID { get; set; }
        public int DireccionID { get; set; }
        public string? MetodoPago { get; set; }
    }
}