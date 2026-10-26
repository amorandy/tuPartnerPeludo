using Dapper;
using MySqlConnector;
using PetShopApi.Models;
using System.Data;

namespace PetShopApi.DAL
{
    public class PedidosDAL
    {
        public readonly ConexionFll _conexionFll;

        public PedidosDAL(ConexionFll conexionFll)
        {
            _conexionFll = conexionFll;
        }

        // Ahora retornamos una Tupla con la Salida y el Modelo
        public (SalidaMod salida, PedidosMod? pedido) ObtenerCarritoPorUsuario(int usuarioId)
        {
            try
            {
                using (var db = _conexionFll.ObtenerConexion())
                {
                    // Diccionario temporal para agrupar los detalles bajo un solo Pedido
                    var pedidoDiccionario = new Dictionary<int, PedidosMod>();

                    // Ejecutamos el SP mapeando el resultado a PedidosMod y DetallePedidosMod
                    db.Query<PedidosMod, DetallePedidosMod, PedidosMod>(
                        "sp_ObtenerCarritoPorUsuario",
                        (pedido, detalle) =>
                        {
                            // 1. Verificamos si ya tenemos este pedido en el diccionario
                            if (!pedidoDiccionario.TryGetValue(pedido.PedidoID, out var pedidoActual))
                            {
                                pedidoActual = pedido;
                                pedidoActual.Detalles = new List<DetallePedidosMod>();
                                pedidoDiccionario.Add(pedidoActual.PedidoID, pedidoActual);
                            }

                            // 2. Si el LEFT JOIN trajo detalles (no nulos), los agregamos a la lista
                            if (detalle != null && detalle.DetalleID > 0)
                            {
                                pedidoActual.Detalles.Add(detalle);
                            }

                            return pedidoActual;
                        },
                        new { p_UsuarioID = usuarioId }, // Dapper asigna los parámetros automáticamente
                        splitOn: "DetalleID", // Le indica a Dapper a partir de qué columna comienza la clase DetallePedidosMod
                        commandType: CommandType.StoredProcedure
                    );

                    // Obtenemos el único pedido resultante (si existe)
                    var pedidoFinal = pedidoDiccionario.Values.FirstOrDefault();

                    if (pedidoFinal == null)
                    {
                        return (new SalidaMod { Codigo = 0, Mensaje = "El usuario no tiene un carrito activo." }, null);
                    }

                    return (new SalidaMod { Codigo = 1, Mensaje = "Carrito obtenido correctamente." }, pedidoFinal);
                }
            }
            catch (Exception ex)
            {
                return (new SalidaMod { Codigo = -1, Mensaje = "Error BD: " + ex.Message }, null);
            }
        }

        public SalidaMod AgregarAlCarrito(AgregarCarritoRequest request)
        {
            try
            {
                using (var db = _conexionFll.ObtenerConexion())
                {
                    db.Open();

                    // 1. OBTENER EL PRECIO SEGURO DESDE LA BASE DE DATOS
                    decimal precioSeguro = 0;
                    string queryPrecio = "SELECT Precio FROM Productos WHERE Id = @ProductoID";
                    using (var cmdPrecio = new MySqlCommand(queryPrecio, db))
                    {
                        cmdPrecio.Parameters.AddWithValue("@ProductoID", request.ProductoID);
                        var result = cmdPrecio.ExecuteScalar();

                        if (result != null && result != DBNull.Value)
                        {
                            precioSeguro = Convert.ToDecimal(result);
                        }
                        else
                        {
                            return new SalidaMod { Codigo = -1, Mensaje = "El producto no existe o no tiene precio." };
                        }
                    }

                    // 2. EJECUTAR TU PROCEDIMIENTO ALMACENADO CON LOS 4 PARÁMETROS
                    var cmd = new MySqlCommand("sp_AgregarAlCarrito", db);
                    cmd.CommandType = CommandType.StoredProcedure;

                    cmd.Parameters.AddWithValue("p_UsuarioID", request.UsuarioID);
                    cmd.Parameters.AddWithValue("p_ProductoID", request.ProductoID);
                    cmd.Parameters.AddWithValue("p_Cantidad", request.Cantidad);

                    // Agregamos el parámetro faltante que pedía el SP
                    cmd.Parameters.AddWithValue("p_PrecioUnitario", precioSeguro);

                    cmd.ExecuteNonQuery();

                    return new SalidaMod { Codigo = 1, Mensaje = "Producto agregado al carrito con éxito" };
                }
            }
            catch (Exception ex)
            {
                return new SalidaMod { Codigo = -1, Mensaje = "Error BD: " + ex.Message };
            }
        }
        public SalidaMod EliminarDelCarrito(int detalleId)
        {
            try
            {
                using (var db = _conexionFll.ObtenerConexion())
                {
                    db.Open();

                    var cmd = new MySqlCommand("sp_EliminarDelCarrito", db);
                    cmd.CommandType = CommandType.StoredProcedure;

                    cmd.Parameters.AddWithValue("p_DetalleID", detalleId);

                    int filasAfectadas = cmd.ExecuteNonQuery();

                    if (filasAfectadas > 0)
                    {
                        return new SalidaMod { Codigo = 1, Mensaje = "Producto eliminado del carrito con éxito." };
                    }
                    else
                    {
                        return new SalidaMod { Codigo = 0, Mensaje = "No se encontró el detalle o ya fue eliminado." };
                    }
                }
            }
            catch (Exception ex)
            {
                return new SalidaMod { Codigo = -1, Mensaje = "Error BD: " + ex.Message };
            }
        }
        public (SalidaMod salida, List<dynamic> pedidos) ObtenerTodosLosPedidos()
        {
            var listaPedidos = new List<dynamic>();
            var salida = new SalidaMod();

            try
            {
                using (var conexion = _conexionFll.ObtenerConexion())
                {
                    conexion.Open();
                    using (var cmd = new MySqlConnector.MySqlCommand("sp_ObtenerTodosLosPedidos", (MySqlConnector.MySqlConnection)conexion))
                    {
                        cmd.CommandType = System.Data.CommandType.StoredProcedure;
                        using (var reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                listaPedidos.Add(new
                                {
                                    pedidoID = Convert.ToInt32(reader["PedidoID"]),
                                    total = Convert.ToDecimal(reader["Total"]),
                                    estado = reader["Estado"].ToString(),
                                    fecha = Convert.ToDateTime(reader["Fecha"]),
                                    clienteNombre = reader["ClienteNombre"].ToString(),
                                    clienteEmail = reader["ClienteEmail"].ToString()
                                });
                            }
                        }
                    }
                    salida = new SalidaMod { Codigo = 1, Mensaje = "Pedidos obtenidos con éxito." };
                }
            }
            catch (Exception ex)
            {
                salida = new SalidaMod { Codigo = -1, Mensaje = ex.Message };
            }

            return (salida, listaPedidos);
        }
        public (SalidaMod salida, PedidosMod? pedido) ObtenerDetallePedidoAdmin(int pedidoId)
        {
            var salida = new SalidaMod();
            PedidosMod? pedido = null;

            try
            {
                using (var conexion = _conexionFll.ObtenerConexion())
                {
                    conexion.Open();
                    using (var cmd = new MySqlConnector.MySqlCommand("sp_ObtenerDetallePedidoAdmin", (MySqlConnector.MySqlConnection)conexion))
                    {
                        cmd.CommandType = System.Data.CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("p_PedidoID", pedidoId);

                        using (var reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                if (pedido == null)
                                {
                                    pedido = new PedidosMod
                                    {
                                        PedidoID = Convert.ToInt32(reader["PedidoID"]),
                                        Total = Convert.ToDecimal(reader["Total"]),
                                        Estado = reader["Estado"].ToString(),
                                        Fecha = Convert.ToDateTime(reader["Fecha"]),
                                        ClienteNombre = reader["ClienteNombre"].ToString(),
                                        ClienteEmail = reader["ClienteEmail"].ToString(),
                                        Detalles = new List<DetallePedidosMod>()
                                    };
                                }

                                pedido.Detalles.Add(new DetallePedidosMod
                                {
                                    ProductoNombre = reader["ProductoNombre"].ToString(),
                                    Cantidad = Convert.ToInt32(reader["Cantidad"]),
                                    PrecioUnitario = Convert.ToDecimal(reader["PrecioUnitario"])
                                });
                            }
                        }
                    }

                    if (pedido != null)
                        salida = new SalidaMod { Codigo = 1, Mensaje = "Detalle obtenido." };
                    else
                        salida = new SalidaMod { Codigo = 0, Mensaje = "Pedido no encontrado." };
                }
            }
            catch (Exception ex)
            {
                salida = new SalidaMod { Codigo = -1, Mensaje = ex.Message };
            }

            return (salida, pedido);
        }
        public SalidaMod ActualizarEstadoPedido(int pedidoId, string estado)
        {
            var salida = new SalidaMod();
            try
            {
                using (var conexion = _conexionFll.ObtenerConexion())
                {
                    conexion.Open();
                    using (var cmd = new MySqlConnector.MySqlCommand("sp_ActualizarEstadoPedido", (MySqlConnector.MySqlConnection)conexion))
                    {
                        cmd.CommandType = System.Data.CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("p_PedidoID", pedidoId);
                        cmd.Parameters.AddWithValue("p_Estado", estado);

                        int filas = cmd.ExecuteNonQuery();
                        if (filas > 0)
                        {
                            salida.Codigo = 1;
                            salida.Mensaje = "Estado actualizado correctamente.";
                        }
                        else
                        {
                            salida.Codigo = 0;
                            salida.Mensaje = "No se encontró el pedido o no se aplicaron cambios.";
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                salida.Codigo = -1;
                salida.Mensaje = ex.Message;
            }
            return salida;
        }
        public SalidaMod ActualizarCantidad(int detalleId, int cantidad)
        {
            var salida = new SalidaMod();
            try
            {
                using (var conexion = _conexionFll.ObtenerConexion())
                {
                    conexion.Open();
                    using (var cmd = new MySqlConnector.MySqlCommand("sp_ActualizarCantidadCarrito", (MySqlConnector.MySqlConnection)conexion))
                    {
                        cmd.CommandType = System.Data.CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("p_DetalleID", detalleId);
                        cmd.Parameters.AddWithValue("p_Cantidad", cantidad);

                        int filas = cmd.ExecuteNonQuery();
                        if (filas > 0)
                        {
                            salida.Codigo = 1;
                            salida.Mensaje = "Cantidad actualizada correctamente.";
                        }
                        else
                        {
                            salida.Codigo = 0;
                            salida.Mensaje = "No se encontró el ítem en el carrito.";
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                salida.Codigo = -1;
                salida.Mensaje = ex.Message;
            }
            return salida;
        }
    }
}
