using MySqlConnector;
using PetShopApi.Mmodels;
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
        public async Task<bool> RegistrarUsuario(Usuario user)
        {
            using (var conexion = _conexionFll.ObtenerConexion())
            {
                await conexion.OpenAsync();

                string sql = "INSERT INTO Usuarios (Nombre, Apellido, Email, PasswordHash) VALUES (@Nombre, @Apellido, @Email, @Pass)";

                using (var cmd = new MySqlCommand(sql, conexion))
                {
                    cmd.Parameters.AddWithValue("@Nombre", user.Nombre);
                    cmd.Parameters.AddWithValue("@Apellido", user.Apellido ?? "");
                    cmd.Parameters.AddWithValue("@Email", user.Email);

                    string passwordHashed = BCrypt.Net.BCrypt.HashPassword(user.Password);
                    cmd.Parameters.AddWithValue("@Pass", passwordHashed);

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
        public async Task<Usuario?> Login(string email, string password)
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
                                return new Usuario
                                {
                                    Nombre = reader["Nombre"].ToString(),
                                    Email = reader["Email"].ToString(),
                                    Telefono = reader["Telefono"].ToString()
                                };
                            }
                            else
                            {
                                throw new Exception("La contraseña ingresada es incorrecta.");
                            }
                        }
                    }

                    int resCodigo = Convert.ToInt32(pCodigo.Value);
                    string resMensaje = pMensaje.Value?.ToString() ?? string.Empty;

                    if (resCodigo != 1) throw new Exception(resMensaje);
                }
            }
            return null;
        }
    }
}