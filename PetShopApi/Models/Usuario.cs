namespace PetShopApi.Mmodels
{
    public class Usuario
    {
        public string? Nombre { get; set; }
        public string? Apellido { get; set; }
        public string? Email { get; set; }
        public string? Password { get; set; }
        public string? Telefono { get; set; }
        public string? CodigoValidacion { get; set; } // El número de 6 dígitos
        public bool? EstaValidado { get; set; } // Cambiará a true al validar
    }
}
