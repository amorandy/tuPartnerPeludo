namespace PetShopApi.Models
{
    public class ProductosMod
    {
        public int Id { get; set; }
        public string? Nombre { get; set; }
        public string? Descripcion { get; set; }
        public decimal Precio { get; set; }
        public int Stock { get; set; }
        public string? UrlImagen { get; set; }
    }
}