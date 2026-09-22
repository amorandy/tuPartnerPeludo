using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using PetShopApi.DAL;

public class ValidarSesionAttribute : ActionFilterAttribute
{
    public string? RolRequerido { get; set; } = null;

    private readonly UsuarioDAL _usuarioDAL;

    public ValidarSesionAttribute(UsuarioDAL usuarioDAL, string? rolRequerido = null)
    {
        _usuarioDAL = usuarioDAL;
        RolRequerido = rolRequerido;
    }
    public override async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        if (context.HttpContext.Request.Method == "OPTIONS")
        {
            await next();
            return;
        }

        var path = context.HttpContext.Request.Path.Value?.ToLower() ?? string.Empty;

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

        var authHeader = context.HttpContext.Request.Headers["Authorization"].ToString();

        if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        string token = authHeader.Substring(7);

        var usuario = await _usuarioDAL.ObtenerUsuarioPorToken(token);

        if (usuario == null)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        if (!string.IsNullOrEmpty(RolRequerido))
        {
            if (usuario.Rol == null || !usuario.Rol.Trim().Equals(RolRequerido.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                context.Result = new ForbidResult();
                return;
            }
        }

        context.HttpContext.Items["Usuario"] = usuario;

        await next();
    }
}