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
        if (user == null) return BadRequest("Datos inválidos");
        try
        {
            if (string.IsNullOrWhiteSpace(user.Email))
            {
                return BadRequest(new { mensaje = "El correo electrónico es obligatorio." });
            }

            string token = Guid.NewGuid().ToString();
            bool exito = await _usuarioDAL.RegistrarUsuarioConToken(user, token);

            if (exito)
            {
                _emailService.EnviarCorreoValidacion(user.Email, token);
                return Ok(new { mensaje = "¡Registro casi listo! Revisa tu correo para activar tu cuenta." });
            }
            return BadRequest(new { mensaje = "No se pudo registrar." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { mensaje = "Ocurrió un error interno.", detalle = ex.Message });
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
        if (request == null || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Datos inválidos");
        }
        try
        {
            var usuario = await _usuarioDAL.Login(request.Email, request.Password);

            if (usuario != null)
            {
                return Ok(new
                {
                    mensaje = $"¡Bienvenido {usuario.Nombre}!",
                    user = usuario.Nombre
                });
            }

            return Unauthorized(new { mensaje = "Email o contraseña incorrectos." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }
}