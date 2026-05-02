using MySqlConnector;
using PetShopApi.Mmodels;
using PetShopApi.Models;
using System.Data;

namespace PetShopApi.DAL
{
    public class UsuarioDAL
    {
        private readonly ConexionFll _conexionFll;

        public UsuarioDAL(ConexionFll conexionFll)
        {
            _conexionFll = conexionFll;
        }
        public async Task<bool> RegistrarUsuario(Usuario user, string tokenEmail, string codigoWhatsApp)
        {
            using (var conexion = _conexionFll.ObtenerConexion())
            {
                await conexion.OpenAsync();

                string sql = @"INSERT INTO Usuarios 
                       (Nombre, Apellido, Email, Telefono, PasswordHash, TokenValidacion, CodigoWhatsApp, EmailValidado) 
                       VALUES 
                       (@Nombre, @Apellido, @Email, @Telefono, @Pass, @TokenEmail, @CodigoWS, 0)";

                using (var cmd = new MySqlCommand(sql, conexion))
                {
                    cmd.Parameters.AddWithValue("@Nombre", user.Nombre);
                    cmd.Parameters.AddWithValue("@Apellido", user.Apellido ?? "");
                    cmd.Parameters.AddWithValue("@Email", user.Email);
                    cmd.Parameters.AddWithValue("@Telefono", user.Telefono);
                    cmd.Parameters.AddWithValue("@Pass", BCrypt.Net.BCrypt.HashPassword(user.Password));

                    cmd.Parameters.AddWithValue("@TokenEmail", tokenEmail);
                    cmd.Parameters.AddWithValue("@CodigoWS", codigoWhatsApp);

                    int filasAfectadas = await cmd.ExecuteNonQueryAsync();
                    return filasAfectadas > 0;
                }
            }
        }
        public async Task<bool> RegistrarUsuarioConToken(Usuario user, string token)
        {
            using (var conexion = _conexionFll.ObtenerConexion())
            {
                await conexion.OpenAsync();
                string sql = @"INSERT INTO Usuarios (Nombre, Apellido, Email, PasswordHash, TokenValidacion, EmailValidado) 
                       VALUES (@Nombre, @Apellido, @Email, @Pass, @Token, 0)";

                using (var cmd = new MySqlCommand(sql, conexion))
                {
                    cmd.Parameters.AddWithValue("@Nombre", user.Nombre);
                    cmd.Parameters.AddWithValue("@Apellido", user.Apellido ?? "");
                    cmd.Parameters.AddWithValue("@Email", user.Email);
                    cmd.Parameters.AddWithValue("@Pass", BCrypt.Net.BCrypt.HashPassword(user.Password));
                    cmd.Parameters.AddWithValue("@Token", token);

                    int filas = await cmd.ExecuteNonQueryAsync();
                    return filas > 0;
                }
            }
        }
        public async Task<bool> ConfirmarEmail(string token)
        {
            using (var conexion = _conexionFll.ObtenerConexion())
            {
                await conexion.OpenAsync();
                string sql = @"UPDATE Usuarios 
                       SET EmailValidado = 1, TokenValidacion = NULL 
                       WHERE TokenValidacion = @token";

                using (var cmd = new MySqlCommand(sql, conexion))
                {
                    cmd.Parameters.AddWithValue("@token", token);
                    int filasAfec = await cmd.ExecuteNonQueryAsync();
                    return filasAfec > 0;
                }
            }
        }
        public async Task<(Usuario? usuario, SalidaMod salida)> Login(string email, string password)
        {
            var salida = new SalidaMod();
            Usuario? usuarioEncontrado = null;
            try
            {
                using (var conexion = _conexionFll.ObtenerConexion())
                {
                    await conexion.OpenAsync();
                    using (var cmd = new MySqlCommand("sp_ValidarLogin", conexion))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@p_Email", email);

                        var pCodigo = new MySqlParameter("@p_Codigo", MySqlDbType.Int32) { Direction = ParameterDirection.Output };
                        var pMensaje = new MySqlParameter("@p_Mensaje", MySqlDbType.VarChar, 500) { Direction = ParameterDirection.Output };
                        cmd.Parameters.Add(pCodigo);
                        cmd.Parameters.Add(pMensaje);

                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            if (await reader.ReadAsync())
                            {
                                string hashAlmacenado = reader["PasswordHash"].ToString() ?? string.Empty;

                                if (BCrypt.Net.BCrypt.Verify(password, hashAlmacenado))
                                {
                                    usuarioEncontrado = new Usuario
                                    {
                                        Nombre = reader["Nombre"].ToString(),
                                        Email = reader["Email"].ToString(),
                                        Telefono = reader["Telefono"].ToString()
                                    };
                                }
                                else
                                {
                                    salida.Codigo = 0; salida.Mensaje = "La contraseña ingresada es incorrecta.";
                                    return (usuarioEncontrado, salida);
                                }
                            }
                        }
                        salida.Codigo = Convert.ToInt32(pCodigo.Value);
                        salida.Mensaje = pMensaje.Value?.ToString();
                    }
                }
                return (usuarioEncontrado, salida);
            }
            catch (Exception ex)
            {
                salida.Codigo = -1; salida.Mensaje = ex.Message;
                return (usuarioEncontrado, salida);
            }
        }
        public async Task<bool> ValidarCodigoWhatsApp(string email, string codigo)
        {
            using (var conexion = _conexionFll.ObtenerConexion())
            {
                await conexion.OpenAsync();

                string sql = @"UPDATE Usuarios 
                       SET EstaValidado = 1, EmailValidado = 1 
                       WHERE Email = @Email AND CodigoWhatsApp = @Codigo";

                using (var cmd = new MySqlCommand(sql, conexion))
                {
                    cmd.Parameters.AddWithValue("@Email", email);
                    cmd.Parameters.AddWithValue("@Codigo", codigo);

                    int filasAfectadas = await cmd.ExecuteNonQueryAsync();

                    return filasAfectadas > 0;
                }
            }
        }
    }
}