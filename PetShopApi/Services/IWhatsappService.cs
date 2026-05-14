using Microsoft.Extensions.Options;
using PetShopApi.Models;

namespace PetShopApi.Services
{
    public interface IWhatsappService
    {
        Task<WhatsappResponse> EnviarCodigoValidacion(string telefono, string codigo);
        Task<WhatsappResponse> EnviarMensajeAsync(string telefono, string mensaje);

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

            // 1. Cambiamos los nombres para que coincidan con el CURL
            var payload = new
            {
                telefono = telefono, // Antes decía 'number'
                codigo = codigo      // Antes decía 'message' y enviaba todo el texto
            };

            try
            {
                // 2. Cambiamos 'send-message' por 'enviar-codigo'
                var url = $"{_settings.BaseUrl}/enviar-codigo";

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
        public async Task<WhatsappResponse> EnviarMensajeAsync(string telefono, string mensaje)
        {
            using var client = new HttpClient();

            // Enviamos 'mensaje' en lugar de 'codigo' para que acepte cualquier texto (links o números)
            var payload = new
            {
                telefono = telefono,
                mensaje = mensaje
            };

            try
            {
                // Usamos la ruta genérica '/enviar' que ya teníamos en Node
                var url = $"{_settings.BaseUrl}/enviar";

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
