using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;

namespace PetShopApi.Services
{
    public class EmailService
    {
        private readonly IConfiguration _configuration;
        private readonly string? _baseUrl;

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
                var portString = _configuration["EmailSettings:SmtpPort"];
                if (string.IsNullOrWhiteSpace(portString))
                {
                    throw new InvalidOperationException("El puerto SMTP no está configurado.");
                }
                int port = int.Parse(portString);
                var senderEmail = _configuration["EmailSettings:SenderEmail"];
                if (string.IsNullOrWhiteSpace(senderEmail))
                {
                    throw new InvalidOperationException("El correo del remitente no está configurado.");
                }
                var password = _configuration["EmailSettings:SenderPassword"];

                using (var client = new SmtpClient(smtpServer, port))
                {
                    client.EnableSsl = true;
                    client.Credentials = new NetworkCredential(senderEmail, password);

                    var mailMessage = new MailMessage(senderEmail, emailDestino)
                    {
                        Subject = "Activa tu cuenta de Partner Peludo",
                        Body = $"Hola {nombre}, para completar tu registro haz clic aquí: {_baseUrl}/confirmar?token={token}",
                        IsBodyHtml = true
                    };

                    await client.SendMailAsync(mailMessage);
                    return (1, "Correo enviado correctamente");
                }
            }
            catch (Exception ex)
            {
                return (-1, "Error al enviar correo: " + ex.Message);
            }
        }
    }
}