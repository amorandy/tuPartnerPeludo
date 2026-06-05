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

        // EL CONSTRUCTOR: Es aquí donde inicializas las variables
        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
            _baseUrl = _configuration["EmailSettings:BaseUrl"];
        }
/*
        public async Task<(int codigo, string mensaje)> EnviarCorreoValidacion(string emailDestino, string token)
        {
            try
            {
                int codigo = 0;
                string mensaje = string.Empty;

                var settings = _config.GetSection("EmailSettings");

                var baseUrl = settings["BaseUrl"];

                string enlace = $"{baseUrl}api/usuarios/confirmar?token={token}";

                var smtpPortString = settings["SmtpPort"];
                if (string.IsNullOrWhiteSpace(smtpPortString))
                {
                    throw new InvalidOperationException("El puerto SMTP no está configurado.");
                }

                var smtpServer = settings["SmtpServer"]; if (string.IsNullOrWhiteSpace(smtpServer))
                    if (string.IsNullOrWhiteSpace(smtpServer))
                    {
                        throw new InvalidOperationException("El servidor SMTP no está configurado.");
                    }

                var client = new SmtpClient(smtpServer, int.Parse(smtpPortString))
                {
                    Credentials = new NetworkCredential(settings["SenderEmail"], settings["SenderPassword"]),
                    EnableSsl = true,
                    UseDefaultCredentials = false, // ¡Muy importante!
                    DeliveryMethod = SmtpDeliveryMethod.Network
                };

                var senderEmail = settings["SenderEmail"];
                if (string.IsNullOrWhiteSpace(senderEmail))
                {
                    throw new InvalidOperationException("La dirección de correo del remitente no está configurada.");
                }

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(senderEmail, "Partner Peludo"),
                    Subject = "Activa tu cuenta de Partner Peludo",
                    Body = $@"
                    <h2>¡Bienvenido a Tu Partner Peludo!</h2>
                    <p>Para completar tu registro, haz clic en el siguiente botón:</p>
                    <a href='{enlace}' style='padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;'>Validar mi cuenta</a>
                    <p>Si el botón no funciona, copia y pega este enlace: <br> {enlace}</p>",
                    IsBodyHtml = true
                };

                mailMessage.To.Add(emailDestino);
                //client.Send(mailMessage);
                await client.SendMailAsync(mailMessage);
                codigo = 1;
                mensaje = "Correo de validación enviado correctamente.";
                return (codigo, mensaje);
            }
            catch (Exception ex)
            {
                string detalle = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                Console.WriteLine($"Error detallado enviando correo: {detalle}"); // Esto saldrá en los logs de Render
                return (-1, "Error: " + detalle); 
            }
        }*/

        public async Task<(int emailCodigo, string emailMensaje)> EnviarCorreoValidacion(string emailDestino, string nombre, string token)
        {
            var url = "https://api.brevo.com/v3/smtp/email";
            var apiKey = _configuration["EmailSettings:SenderPassword"];

            using (var httpClient = new HttpClient())
            {
                httpClient.DefaultRequestHeaders.Add("api-key", apiKey);

                var payload = new
                {
                    sender = new { name = "Tu Partner Peludo", email = "adb95a001@smtp-brevo.com" },
                    to = new[] { new { email = emailDestino, name = nombre } },
                    subject = "Activa tu cuenta de Partner Peludo",
                    htmlContent = $"<p>Hola {nombre}, para completar tu registro haz clic aquí: <a href='{_baseUrl}/confirmar?token={token}'>Validar</a></p>"
                };

                // Convertimos a JSON usando System.Text.Json (nativo)
                var json = JsonSerializer.Serialize(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await httpClient.PostAsync(url, content);

                if (response.IsSuccessStatusCode)
                    return (1, "Correo enviado correctamente");
                else
                    return (-1, "Error: " + await response.Content.ReadAsStringAsync());
            }
        }
    }
}