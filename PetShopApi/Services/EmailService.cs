using MimeKit;
using System.Threading.Tasks;
using PetShopApi.Models;
using Microsoft.Extensions.Configuration;
using System;

namespace PetShopApi.Services
{
    public class EmailService
    {
        private readonly IConfiguration _configuration;
        private readonly string _baseUrl;
        private readonly string _smtpHost;
        private readonly int _smtpPort;
        private readonly string _smtpUser;
        private readonly string _smtpPass;
        private readonly string _emailFrom;
        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
            _baseUrl = _configuration["EmailSettings:BaseUrl"] ?? "https://tupartnerpeludo.onrender.com";
            _smtpHost = _configuration["EmailSettings:SMTP_HOST"] ?? "smtp-relay.brevo.com";
            _smtpPort = int.Parse(_configuration["EmailSettings:SMTP_PORT"] ?? "2525");
            _smtpUser = _configuration["EmailSettings:SMTP_USER"] ?? "adb95a001@smtp-brevo.com";
            _smtpPass = _configuration["EmailSettings:SMTP_PASS"] ?? "xsmtpsib-b206b8390a395271d19d28fad8990400817f1b97a438ef7614e108a8049ee693-FwqHmfFJ9nJLrnDw";
            _emailFrom = _configuration["EmailSettings:EMAIL_FROM"] ?? "partnerpeludo@gmail.com";
        }
        public async Task<SalidaMod> EnviarCorreoValidacion(string emailDestino, string nombre, string token)
        {
            if (string.IsNullOrWhiteSpace(_smtpHost) || string.IsNullOrWhiteSpace(_smtpUser) || string.IsNullOrWhiteSpace(_smtpPass) || string.IsNullOrWhiteSpace(_emailFrom))
            {
                throw new InvalidOperationException("SMTP_HOST, SMTP_USER, SMTP_PASS o EMAIL_FROM no están configurados en las variables de entorno.");
            }
            try
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress("Tu Partner Peludo", _emailFrom));
                message.To.Add(new MailboxAddress(nombre, emailDestino));
                message.Subject = "Activa tu cuenta de Partner Peludo";

                message.Body = new TextPart("html")
                {
                    Text = $"<p>Hola {nombre}, para completar tu registro haz clic aquí: <a href='{_baseUrl}/api/Usuarios/confirmar?token={token}'>Validar cuenta</a></p>"
                };

                using (var client = new MailKit.Net.Smtp.SmtpClient())
                {
                    await client.ConnectAsync(_smtpHost, _smtpPort, MailKit.Security.SecureSocketOptions.StartTls);
                    await client.AuthenticateAsync(_smtpUser, _smtpPass);
                    await client.SendAsync(message);
                    await client.DisconnectAsync(true);
                }

                return new SalidaMod { Codigo = 1, Mensaje = "Correo enviado correctamente" };
            }
            catch (Exception ex)
            {
                return new SalidaMod { Codigo = -1, Mensaje = "Error SMTP: " + ex.Message };
            }
        }
        public async Task<SalidaMod> EnviarEmailAsync(string emailDestino, string asunto, string cuerpoHtml)
        {
            if (string.IsNullOrWhiteSpace(_smtpHost) || string.IsNullOrWhiteSpace(_smtpUser) ||
                string.IsNullOrWhiteSpace(_smtpPass) || string.IsNullOrWhiteSpace(_emailFrom))
            {
                return new SalidaMod { Codigo = -1, Mensaje = "Error de configuración SMTP." };
            }

            try
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress("Tu Partner Peludo", _emailFrom));
                message.To.Add(new MailboxAddress("", emailDestino));
                message.Subject = asunto;
                message.Body = new TextPart("html") { Text = cuerpoHtml };

                using (var client = new MailKit.Net.Smtp.SmtpClient())
                {
                    await client.ConnectAsync(_smtpHost, _smtpPort, MailKit.Security.SecureSocketOptions.StartTls);
                    await client.AuthenticateAsync(_smtpUser, _smtpPass);
                    await client.SendAsync(message);
                    await client.DisconnectAsync(true);
                }

                return new SalidaMod { Codigo = 1, Mensaje = "Correo enviado correctamente." };
            }
            catch (Exception ex)
            {
                return new SalidaMod { Codigo = -1, Mensaje = "Error al enviar correo: " + ex.Message };
            }
        }
        public async Task<SalidaMod> EnviarCorreoPasswordActualizada(string emailDestino, string nombre, string apellido, string token)
        {
            if (string.IsNullOrWhiteSpace(_smtpHost) || string.IsNullOrWhiteSpace(_smtpUser) || string.IsNullOrWhiteSpace(_smtpPass) || string.IsNullOrWhiteSpace(_emailFrom))
            {
                throw new InvalidOperationException("SMTP_HOST, SMTP_USER, SMTP_PASS o EMAIL_FROM no están configurados en las variables de entorno.");
            }
            try
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress("Tu Partner Peludo", _emailFrom));
                message.To.Add(new MailboxAddress($"{nombre} {apellido}", emailDestino));
                message.Subject = "Se Actualizo su contraseña Tu Partner Peludo";
                message.Body = new TextPart("html")
                {
                    Text = $"<p>Hola {nombre} {apellido}, tu contraseña en \"Tu Partner Peludo\" ha sido actualizada correctamente.</p>"
                };
                using (var client = new MailKit.Net.Smtp.SmtpClient())
                {
                    await client.ConnectAsync(_smtpHost, _smtpPort, MailKit.Security.SecureSocketOptions.StartTls);
                    await client.AuthenticateAsync(_smtpUser, _smtpPass);
                    await client.SendAsync(message);
                    await client.DisconnectAsync(true);
                }
                return new SalidaMod { Codigo = 1, Mensaje = "Correo de restablecimiento enviado correctamente" };
            }
            catch (Exception ex)
            {
                return new SalidaMod { Codigo = -1, Mensaje = "Error SMTP: " + ex.Message };
            }
        }
        public async Task EnviarReciboCompra(string emailDestino, PedidosMod pedido)
        {
            if (string.IsNullOrWhiteSpace(_smtpHost) || string.IsNullOrWhiteSpace(_smtpUser) || string.IsNullOrWhiteSpace(_smtpPass) || string.IsNullOrWhiteSpace(_emailFrom))
            {
                throw new InvalidOperationException("Configuración SMTP incompleta.");
            }

            string filasProductos = "";
            foreach (var item in pedido.Detalles)
            {
                decimal subtotal = item.Cantidad * item.PrecioUnitario;
                filasProductos += $@"
            <tr>
                <td style='padding: 10px; border-bottom: 1px solid #eee;'>{item.ProductoNombre}</td>
                <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: center;'>{item.Cantidad}</td>
                <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: right;'>${item.PrecioUnitario:N0}</td>
                <td style='padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;'>${subtotal:N0}</td>
            </tr>";
            }

            string cuerpoHtml = $@"
            <div style='font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;'>
                <div style='background-color: #1a1d20; color: #fff; padding: 20px; text-align: center;'>
                    <h2 style='margin: 0; color: #f5c21b;'>¡Gracias por tu compra!</h2>
                    <p style='margin: 5px 0 0 0;'>Tu Pedido #{pedido.PedidoID} ha sido recibido.</p>
                </div>
        
                <div style='padding: 20px;'>
                    <p>Hola <strong>{pedido.ClienteNombre}</strong>,</p>
                    <p>Estamos procesando tu pedido. Aquí tienes un resumen de tu compra:</p>

                    <table style='width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;'>
                        <thead style='background-color: #f8f9fa; text-transform: uppercase; font-size: 12px; color: #666;'>
                            <tr>
                                <th style='padding: 10px; text-align: left;'>Producto</th>
                                <th style='padding: 10px; text-align: center;'>Cant.</th>
                                <th style='padding: 10px; text-align: right;'>Precio</th>
                                <th style='padding: 10px; text-align: right;'>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filasProductos}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan='3' style='padding: 15px 10px; text-align: right; font-weight: bold;'>Total a Pagar:</td>
                                <td style='padding: 15px 10px; text-align: right; font-weight: bold; color: #28a745; font-size: 16px;'>${pedido.Total:N0}</td>
                            </tr>
                        </tfoot>
                    </table>

                    <div style='margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 5px;'>
                        <h4 style='margin-top: 0; margin-bottom: 10px; font-size: 14px; color: #555;'>Detalles de Envío y Pago</h4>
                        <p style='margin: 0 0 5px 0; font-size: 13px;'><strong>Método de pago:</strong> {pedido.MetodoPago}</p>
                        <p style='margin: 0; font-size: 13px;'><strong>Dirección:</strong> {(string.IsNullOrEmpty(pedido.Alias) ? "" : pedido.Alias + " - ")}{pedido.DireccionCompleta}</p>
                    </div>
                </div>

                <div style='background-color: #f1f1f1; color: #777; text-align: center; padding: 15px; font-size: 12px;'>
                    <p style='margin: 0;'>Tu Partner Peludo &copy; {System.DateTime.Now.Year}. Todos los derechos reservados.</p>
                </div>
            </div>";

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress("Tu Partner Peludo", _emailFrom));
            message.To.Add(new MailboxAddress(pedido.ClienteNombre, emailDestino));
            message.Subject = $"Confirmación de Pedido #{pedido.PedidoID}";
            message.Body = new TextPart("html") { Text = cuerpoHtml };

            using (var client = new MailKit.Net.Smtp.SmtpClient())
            {
                await client.ConnectAsync(_smtpHost, _smtpPort, MailKit.Security.SecureSocketOptions.StartTls);
                await client.AuthenticateAsync(_smtpUser, _smtpPass);
                await client.SendAsync(message);
                await client.DisconnectAsync(true);
            }
        }
    }
}