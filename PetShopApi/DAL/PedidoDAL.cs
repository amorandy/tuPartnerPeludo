using Dapper;
using PetShopApi.Models;
using System.Data;

namespace PetShopApi.DAL
{
    public class PedidoDAL
    {
        public readonly ConexionFll _conexionFll;
        public PedidoDAL(ConexionFll conexionFll)
        {
            _conexionFll = conexionFll;
        }
        public async Task<SalidaMod> AgregarAlCarrito(Pedido nuevoPedido)
        {
            try
            {
                using (IDbConnection db = _conexionFll.ObtenerConexion())
                {
                    db.Open();
                    using (var transaction = db.BeginTransaction())
                    {
                        try
                        {
                            foreach (var item in nuevoPedido.Items)
                            {
                                await db.ExecuteAsync(
                                    "sp_agregarAlCarrito",
                                    new
                                    {
                                        p_UsuarioID = nuevoPedido.UsuarioId,
                                        p_ProductoID = item.ProductoId,
                                        p_Cantidad = item.Cantidad,
                                        p_PrecioUnitario = item.PrecioUnitario
                                    },
                                    transaction: transaction,
                                    commandType: CommandType.StoredProcedure
                                );
                            }

                            transaction.Commit();
                            return new SalidaMod { Codigo = 1, Mensaje = "Pedido agregado al carrito con éxito" };
                        }
                        catch (Exception)
                        {
                            transaction.Rollback();
                            throw;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return new SalidaMod { Codigo = -1, Mensaje = ex.Message };
            }
        }
    }
}
