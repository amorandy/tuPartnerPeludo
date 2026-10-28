using Dapper;
using Microsoft.AspNetCore.Mvc;
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

        public (SalidaMod salida, List<CarritoMod> carrito) ObtenerCarritoPorUsuario(int usuarioId)
        {
            var salida = new SalidaMod();
            var listaCarrito = new List<CarritoMod>();

            try
            {
                using (var db = _conexionFll.ObtenerConexion())
                {
                    var resultado = db.Query<CarritoMod>(
                        "sp_ObtenerCarritoPorUsuario",
                        new { p_UsuarioID = usuarioId },
                        commandType: CommandType.StoredProcedure
                    ).ToList();

                    listaCarrito = resultado;
                    salida.Codigo = 1;
                    salida.Mensaje = "Carrito obtenido correctamente.";
                }
            }
            catch (Exception ex)
            {
                salida.Codigo = -1;
                salida.Mensaje = "Error al obtener el carrito: " + ex.Message;
            }

            return (salida, listaCarrito);
        }

        public SalidaMod AgregarAlCarrito(AgregarCarritoRequest request)
        {
            try
            {
                using (var db = _conexionFll.ObtenerConexion())
                {
                    db.Open();

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

                    var cmd = new MySqlCommand("sp_AgregarAlCarrito", db);
                    cmd.CommandType = CommandType.StoredProcedure;

                    cmd.Parameters.AddWithValue("p_UsuarioID", request.UsuarioID);
                    cmd.Parameters.AddWithValue("p_ProductoID", request.ProductoID);
                    cmd.Parameters.AddWithValue("p_Cantidad", request.Cantidad);

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
                    using (var cmd = new MySqlCommand("sp_ObtenerTodosLosPedidos", (MySqlConnection)conexion))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        using (var reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                listaPedidos.Add(new
                                {
                                    pedidoID = Convert.ToInt32(reader["PedidoID"]),
                                    total = Convert.ToDecimal(reader["Total"]),
                                    estado = reader["Estado"] != DBNull.Value ? reader["Estado"]!.ToString()! : string.Empty,
                                    ClienteNombre = reader["ClienteNombre"] != DBNull.Value ? reader["ClienteNombre"].ToString()! : string.Empty,
                                    ClienteEmail = reader["ClienteEmail"] != DBNull.Value ? reader["ClienteEmail"].ToString()! : string.Empty,
                                    fecha = reader["Fecha"] != DBNull.Value ? Convert.ToDateTime(reader["Fecha"]) : default(DateTime)
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
                    using (var cmd = new MySqlCommand("sp_ObtenerDetallePedidoAdmin", (MySqlConnection)conexion))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
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
                                        Estado = reader["Estado"] != DBNull.Value ? reader["Estado"].ToString() ?? string.Empty : string.Empty,
                                        Fecha = Convert.ToDateTime(reader["Fecha"]),
                                        ClienteNombre = reader["ClienteNombre"] != DBNull.Value ? reader["ClienteNombre"]!.ToString() ?? string.Empty : string.Empty,
                                        ClienteEmail = reader["ClienteEmail"] != DBNull.Value ? reader["ClienteEmail"]!.ToString() ?? string.Empty : string.Empty,
                                        MetodoPago = reader["MetodoPago"] != DBNull.Value ? reader["MetodoPago"]!.ToString() ?? "No especificado" : "No especificado",
                                        Alias = reader["Alias"] != DBNull.Value ? reader["Alias"].ToString() ?? "Sin alias" : "Sin alias",
                                        DireccionCompleta = reader["DireccionCompleta"] != DBNull.Value ? reader["DireccionCompleta"]!.ToString() ?? "Retiro en tienda" : "Retiro en tienda",
                                        Referencias = reader["Referencias"] != DBNull.Value ? reader["Referencias"]!.ToString() ?? string.Empty : string.Empty,

                                        Detalles = new List<DetallePedidosMod>()
                                    };
                                }

                                pedido.Detalles.Add(new DetallePedidosMod
                                {
                                    ProductoNombre = reader["ProductoNombre"] != null ? reader["ProductoNombre"].ToString() ?? string.Empty : string.Empty,
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
                    using (var cmd = new MySqlCommand("sp_ActualizarEstadoPedido", (MySqlConnection)conexion))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
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
                    using (var cmd = new MySqlCommand("sp_ActualizarCantidadCarrito", (MySqlConnection)conexion))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
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
        public SalidaMod ProcesarCheckout(int usuarioId, int direccionId, string metodoPago)
        {
            var salida = new SalidaMod();
            try
            {
                using (var conexion = _conexionFll.ObtenerConexion())
                {
                    conexion.Open();
                    using (var cmd = new MySqlCommand("sp_ProcesarCheckout", (MySqlConnection)conexion))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("p_UsuarioID", usuarioId);
                        cmd.Parameters.AddWithValue("p_DireccionID", direccionId);
                        cmd.Parameters.AddWithValue("p_MetodoPago", metodoPago);

                        cmd.Parameters.Add(new MySqlParameter("p_PedidoID", MySqlDbType.Int32) { Direction = ParameterDirection.Output });
                        cmd.Parameters.Add(new MySqlParameter("p_Codigo", MySqlDbType.Int32) { Direction = ParameterDirection.Output });
                        cmd.Parameters.Add(new MySqlParameter("p_Mensaje", MySqlDbType.VarChar) { Direction = ParameterDirection.Output });

                        cmd.ExecuteNonQuery();

                        salida.Codigo = Convert.ToInt32(cmd.Parameters["p_Codigo"].Value);
                        salida.Mensaje = cmd.Parameters["p_Mensaje"].Value?.ToString() ?? string.Empty;
                        salida.Id = Convert.ToInt32(cmd.Parameters["p_PedidoID"].Value);
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
