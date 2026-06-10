using System.Buffers.Text;
using System.Net;
using System.Net.Mail;
using System.Net.Http;
using System.Text;
using System.Text.Json;

namespace PetShopApi.Services
{
    public class EmailService
    {
        private readonly IConfiguration _configuration;
        private readonly string _baseUrl;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
            _baseUrl = _configuration["EmailSettings:BaseUrl"];
        }
        public async Task<(int emailCodigo, string emailMensaje)> EnviarCorreoValidacion(string emailDestino, string nombre, string token)
        {
            try
            {
                var smtpServer = _configuration["EmailSettings:SmtpServer"];
                var port = int.Parse(_configuration["EmailSettings:SmtpPort"]);
                var senderEmail = _configuration["EmailSettings:SenderEmail"];
                var password = _configuration["EmailSettings:SenderPassword"];

                using (var client = new SmtpClient(smtpServer, port))
                {
                    client.EnableSsl = true;
                    client.Credentials = new NetworkCredential(senderEmail, password);

                    var mailMessage = new MailMessage(senderEmail, emailDestino)
                    {
                        Subject = "Activa tu cuenta",
                        Body = $"Hola {nombre}, haz clic aquí: {_baseUrl}/confirmar?token={token}",
                        IsBodyHtml = true
                    };

                    await client.SendMailAsync(mailMessage);
                    return (1, "Correo enviado correctamente");
                }
            }
            catch (Exception ex)
            {
                return (-1, "Error: " + ex.Message);
            }
        }
    }
}