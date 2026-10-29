using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetShopApi.DAL;
using PetShopApi.Models;
using PetShopApi.Services;

namespace PetShopApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous]
    public class PedidosController : ControllerBase
    {
        private readonly PedidosDAL _pedidoDAL;
        private readonly EmailService _emailService;

        public PedidosController(PedidosDAL pedidoDAL, EmailService emailService)
        {
            _pedidoDAL = pedidoDAL;
            _emailService = emailService; // <-- 3. Inicializa la variable
        }

        [HttpGet("carrito/{usuarioId}")]
        public IActionResult ObtenerCarrito(int usuarioId)
        {
            try
            {
                const decimal IMPUESTO_TASA = 0.19m;

                var (salida, listaCarrito) = _pedidoDAL.ObtenerCarritoPorUsuario(usuarioId);

                if (salida.Codigo == -1) return StatusCode(500, salida);

                if (listaCarrito == null || listaCarrito.Count == 0)
                {
                    return Ok(new { Items = new List<object>(), Subtotal = 0, Impuesto = 0, Total = 0, salida });
                }

                decimal totalFinal = listaCarrito.Sum(d => d.Cantidad * d.PrecioUnitario);

                decimal subtotalNeto = Math.Round(totalFinal / (1 + IMPUESTO_TASA), 0);

                decimal montoImpuesto = totalFinal - subtotalNeto;

                return Ok(new
                {
                    salida,
                    subtotal = subtotalNeto,
                    impuesto = montoImpuesto,
                    total = totalFinal,
                    Items = listaCarrito
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
        [HttpDelete("eliminar/{detalleId}")]
        public IActionResult EliminarDelCarrito(int detalleId)
        {
            try
            {
                var salida = _pedidoDAL.EliminarDelCarrito(detalleId);

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
        [HttpGet("detalle/{pedidoId}")]
        public IActionResult ObtenerDetalle(int pedidoId)
        {
            try
            {
                var (salida, pedido) = _pedidoDAL.ObtenerDetallePedidoAdmin(pedidoId);

                if (salida.Codigo == 1 && pedido != null)
                {
                    return Ok(new { salida, pedido });
                }

                return BadRequest(salida);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new SalidaMod { Codigo = -1, Mensaje = ex.Message });
            }
        }
        [HttpGet("todos")]
        public IActionResult ObtenerTodos()
        {
            try
            {
                var (salida, pedidos) = _pedidoDAL.ObtenerTodosLosPedidos();

                if (salida.Codigo == 1)
                {
                    return Ok(new { codigo = 1, pedidos = pedidos });
                }
                else
                {
                    return BadRequest(new { codigo = salida.Codigo, mensaje = salida.Mensaje });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { codigo = -1, mensaje = ex.Message });
            }
        }
        [HttpGet("usuario/{usuarioId}")]
        public IActionResult ObtenerPorUsuario(int usuarioId)
        {
            try
            {
                var (salida, pedidos) = _pedidoDAL.ObtenerPedidosPorUsuario(usuarioId);

                if (salida.Codigo == 1)
                {
                    return Ok(pedidos);
                }
                else
                {
                    return BadRequest(new { codigo = salida.Codigo, mensaje = salida.Mensaje });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { codigo = -1, mensaje = ex.Message });
            }
        }
        [HttpPut("actualizar-estado")]
        // Opcional: [TypeFilter(typeof(ValidarSesionAttribute), Arguments = new object[] { "Admin" })]
        public IActionResult ActualizarEstado([FromBody] ActualizarEstadoRequest request)
        {
            try
            {
                var salida = _pedidoDAL.ActualizarEstadoPedido(request.PedidoID, request.Estado);

                if (salida.Codigo == 1)
                {
                    return Ok(salida);
                }
                else
                {
                    return BadRequest(salida);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { codigo = -1, mensaje = ex.Message });
            }
        }
        [HttpPut("actualizar-cantidad")]
        public IActionResult ActualizarCantidad([FromBody] ActualizarCantidadRequest request)
        {
            try
            {
                if (request.Cantidad < 1)
                {
                    return BadRequest(new { codigo = 0, mensaje = "La cantidad debe ser mayor a 0." });
                }

                var salida = _pedidoDAL.ActualizarCantidad(request.DetalleID, request.Cantidad);

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
        [HttpPost("procesar-checkout")]
        public async Task<IActionResult> ProcesarCheckout([FromBody] CheckoutRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.MetodoPago))
            {
                return BadRequest(new SalidaMod { Codigo = 0, Mensaje = "El método de pago es obligatorio." });
            }

            var salida = _pedidoDAL.ProcesarCheckout(request.UsuarioID, request.DireccionID, request.MetodoPago);

            if (salida.Codigo == 1 && salida.Id.HasValue)
            {
                int nuevoPedidoId = salida.Id.Value;

                var (salidaDetalle, pedidoCompleto) = _pedidoDAL.ObtenerDetallePedidoAdmin(nuevoPedidoId);

                if (salidaDetalle.Codigo == 1 && pedidoCompleto != null)
                {
                    try
                    {
                        await _emailService.EnviarReciboCompra(pedidoCompleto.ClienteEmail, pedidoCompleto);
                    }
                    catch (Exception)
                    {
                        // Silenciamos el error del correo para no detener la compra
                    }

                    // Devolvemos el modelo estándar SalidaMod
                    salida.Data = pedidoCompleto;
                    salida.Mensaje = "Pedido generado con éxito";
                    return Ok(salida);
                }
            }

            return BadRequest(salida);
        }
    }
}
