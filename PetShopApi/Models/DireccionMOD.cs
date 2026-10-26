namespace PetShopApi.Models
{
    public class DireccionMod
    {
        public int DireccionID { get; set; }
        public int UsuarioID { get; set; }
        public string? Alias { get; set; }
        public string DireccionCompleta { get; set; } = string.Empty;
        public string? Referencias { get; set; }
        public bool EsPrincipal { get; set; }
    }
}