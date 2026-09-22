using Microsoft.AspNetCore.Mvc;
using PetShopApi.DAL;
using PetShopApi.Models;

namespace PetShopApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PedidosController : ControllerBase
    {
        private readonly PedidoDAL _pedidoDAL;
        public PedidosController(PedidoDAL pedidoDAL)
        {
            _pedidoDAL = pedidoDAL;
        }
        [HttpPost("agregar")]
        [ServiceFilter(typeof(ValidarSesionAttribute))]
        public async Task<IActionResult> AgregarPedido([FromBody] Pedido nuevoPedido)
        {
            try
            {
                // Validar que el carrito no esté vacío
                if (nuevoPedido.Items == null || nuevoPedido.Items.Count == 0)
                {
                    return BadRequest(new { mensaje = "El carrito está vacío." });
                }

                // Llamamos al DAL que ahora devuelve un SalidaMod
                SalidaMod resultado = await _pedidoDAL.AgregarAlCarrito(nuevoPedido);

                if (resultado.Codigo == 1)
                {
                    return Ok(new { codigo = 1, mensaje = resultado.Mensaje });
                }

                return BadRequest(new { codigo = -1, mensaje = resultado.Mensaje });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error interno del servidor", error = ex.Message });
            }
        }
    }
}
