namespace PetShopApi.Models
{
    public class CarritoMod
    {
        public int CarritoID { get; set; }
        public int UsuarioID { get; set; }
        public int ProductoID { get; set; }
        public string ProductoNombre { get; set; } = string.Empty;
        public int Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
    }
}
