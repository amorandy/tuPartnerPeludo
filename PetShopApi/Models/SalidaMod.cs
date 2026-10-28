namespace PetShopApi.Models
{
    public class SalidaMod
    {
        public int Codigo { get; set; }
        public string? Mensaje { get; set; }
        public int? Id { get; set; }
        public object? Data { get; set; }
        public List<MensajeRespuesta> Salidas { get; set; } = new List<MensajeRespuesta>();
    }
}
