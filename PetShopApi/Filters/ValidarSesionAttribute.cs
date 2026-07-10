using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using PetShopApi.DAL;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using System.Linq;

public class ValidarSesionAttribute : ActionFilterAttribute
{
    private readonly UsuarioDAL _usuarioDAL;
    public ValidarSesionAttribute(UsuarioDAL usuarioDAL)
    {
        _usuarioDAL = usuarioDAL;
    }
    public override async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        // 1. IGNORAR Peticiones OPTIONS (CORS preflight)
        // Esto permite que el navegador pregunte si la petición está permitida
        if (context.HttpContext.Request.Method == "OPTIONS")
        {
            await next();
            return;
        }

        // 2. Obtener la ruta
        var path = context.HttpContext.Request.Path.Value?.ToLower() ?? string.Empty;

        // 3. Comprobar rutas públicas
        bool esRutaPublica = path.Contains("/login") ||
                             path.Contains("/registrar") ||
                             path.Contains("/verificar-codigo") ||
                             path.Contains("/api/usuarios/confirmar");

        bool tieneAllowAnonymous = context.ActionDescriptor.EndpointMetadata.Any(m => m is AllowAnonymousAttribute);

        if (esRutaPublica || tieneAllowAnonymous)
        {
            await next();
            return;
        }

        // 4. Validar encabezado Authorization
        var authHeader = context.HttpContext.Request.Headers["Authorization"].ToString();

        if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        string token = authHeader.Substring(7);

        // 5. Validar contra la base de datos
        bool esValido = await _usuarioDAL.ValidarTokenEnBD(token);

        if (!esValido)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        await next();
    }
}