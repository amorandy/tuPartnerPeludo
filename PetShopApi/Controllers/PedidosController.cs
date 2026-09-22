using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetShopApi.DAL;
using PetShopApi.Models;

namespace PetShopApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous] // Puedes cambiarlo a [Authorize] si requieres token
    public class PedidosController : ControllerBase
    {
        private readonly PedidosDAL _pedidoDAL;

        // Inyectamos el DAL a través del constructor tal como en ProductosController
        public PedidosController(PedidosDAL pedidoDAL)
        {
            _pedidoDAL = pedidoDAL;
        }

        [HttpGet("carrito/{usuarioId}")]
        public IActionResult ObtenerCarrito(int usuarioId)
        {
            try
            {
                // 1. Desestructuramos la tupla para obtener salida y pedido por separado
                var (salida, pedido) = _pedidoDAL.ObtenerCarritoPorUsuario(usuarioId);

                // 2. Evaluamos si hubo un error en la base de datos
                if (salida.Codigo == -1)
                {
                    return StatusCode(500, salida);
                }

                // 3. Si no hay carrito pendiente
                if (pedido == null)
                {
                    return Ok(new
                    {
                        Items = new List<object>(),
                        Total = 0,
                        salida // Enviamos también la salida para que el front sepa qué pasó
                    });
                }

                // 4. Si hay carrito, armamos el objeto exacto que espera tu JavaScript
                return Ok(new
                {
                    salida,
                    pedido.PedidoID,
                    pedido.Total,
                    // Mapeamos 'Detalles' a 'Items' para compatibilidad con tu JS actual
                    Items = pedido.Detalles
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { codigo = -1, mensaje = ex.Message });
            }
        }

        [HttpPost("agregar")]
        public IActionResult AgregarAlCarrito([FromBody] AgregarCarritoRequest request)
        {
            try
            {
                var salida = _pedidoDAL.AgregarAlCarrito(request);

                if (salida.Codigo == 1)
                    return Ok(salida);
                else
                    return BadRequest(salida);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { codigo = -1, mensaje = ex.Message });
            }
        }
        // Aquí puedes agregar tus otros métodos como AgregarAlCarrito, etc.
    }
}
