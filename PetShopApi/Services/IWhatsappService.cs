using Microsoft.Extensions.Options;
using PetShopApi.Models;

namespace PetShopApi.Services
{
    public interface IWhatsappService
    {
        Task<WhatsappResponse> EnviarCodigoValidacion(string telefono, string codigo);
    }

    public class WhatsappService : IWhatsappService
    {
        private readonly WhatsappSettings _settings;

        public WhatsappService(IOptions<WhatsappSettings> settings)
        {
            _settings = settings.Value;
        }

        public async Task<WhatsappResponse> EnviarCodigoValidacion(string telefono, string codigo)
        {
            using var client = new HttpClient();
            var mensaje = $"🐾 ¡Hola! Tu código de validación para Tu Partner Peludo es: {codigo}";

            var payload = new
            {
                number = telefono,
                message = mensaje
            };

            try
            {
                var url = $"{_settings.BaseUrl}/send-message";
                var response = await client.PostAsJsonAsync(url, payload);

                return new WhatsappResponse
                {
                    Sent = response.IsSuccessStatusCode,
                    Message = response.IsSuccessStatusCode ? "Enviado" : "Error en servidor local"
                };
            }
            catch (Exception ex)
            {
                return new WhatsappResponse { Sent = false, Message = ex.Message };
            }
        }
    }
}
