namespace PetShopApi.Models
{
    public class SalidaMod
    {
        public int Codigo { get; set; } // 1: Éxito, 0: Info/Aviso, -1: Error
        public string? Mensaje { get; set; }
    }
}
