using Dapper;
using MySqlConnector;
using PetShopApi.Models;
using System;
using System.Collections.Generic;
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
                    cmd.CommandType = System.Data.CommandType.StoredProcedure;

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
    }
}