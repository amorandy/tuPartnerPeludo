using Microsoft.AspNetCore.Mvc;
using PetShopApi.DAL;
using PetShopApi.Mmodels;
using PetShopApi.Models;
using PetShopApi.Services;

[ApiController]
[Route("api/[controller]")]
public class UsuariosController : ControllerBase
{
    private readonly UsuarioDAL _usuarioDAL;
    private readonly EmailService _emailService;

    public UsuariosController(UsuarioDAL usuarioDAL, EmailService emailService)
    {
        _usuarioDAL = usuarioDAL;
        _emailService = emailService;
    }

    [HttpPost("registrar")]
    public async Task<IActionResult> Registrar([FromBody] Usuario user)
    {
        if (user == null) return BadRequest(new { codigo = 0, mensaje = "Datos inválidos" });
        try
        {
            if (string.IsNullOrWhiteSpace(user.Email))
            {
                return BadRequest(new { codigo = 0, mensaje = "El correo electrónico es obligatorio." });
            }

            string token = Guid.NewGuid().ToString();
            bool exito = await _usuarioDAL.RegistrarUsuarioConToken(user, token);

            if (exito)
            {
                _emailService.EnviarCorreoValidacion(user.Email, token);
                return Ok(new
                {
                    codigo = 1,
                    mensaje = "¡Registro exitoso! Por favor, revisa tu bandeja de entrada o WhatsApp para validar tu cuenta."
                });
            }
            return BadRequest(new { codigo = 0, mensaje = "No se pudo completar el registro. El usuario ya podría existir." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { cpSalidas = new[] { new { Codigo = -1, Mensaje = "Error interno: " + ex.Message }}});
        }
    }

    [HttpGet("confirmar")]
    public async Task<IActionResult> Confirmar(string token)
    {
        if (string.IsNullOrEmpty(token)) return BadRequest("Token no proporcionado.");
        try
        {
            bool confirmado = await _usuarioDAL.ConfirmarEmail(token);
            if (confirmado)
            {
                return Content("<html><body><h1>¡Cuenta activada!</h1><p>Ya puedes iniciar sesión en PetShop.</p></body></html>", "text/html");
            }
            return BadRequest("El enlace es inválido o ya ha expirado.");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error al confirmar: {ex.Message}");
        }
    }
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var (usuario, salida) = await _usuarioDAL.Login(request.Email ?? "", request.Password ?? "");

            if (salida.Codigo == 1 && usuario != null)
            {
                return Ok(new
                {
                    codigo = salida.Codigo,
                    mensaje = salida.Mensaje,
                    user = usuario.Nombre
                });
            }

            return BadRequest(new { codigo = salida.Codigo, mensaje = salida.Mensaje });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { codigo = -1, mensaje = "Error crítico: " + ex.Message });
        }
    }
}