using MySqlConnector;
using PetShopApi.Mmodels;

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
                string sql = "SELECT * FROM Usuarios WHERE Email = @Email";

                using (var cmd = new MySqlCommand(sql, conexion))
                {
                    cmd.Parameters.AddWithValue("@Email", email);
                    using (var reader = await cmd.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            if (Convert.ToInt32(reader["EmailValidado"]) == 0)
                            {
                                throw new Exception("Debes validar tu correo antes de iniciar sesión.");
                            }

                            string hashAlmacenado = reader["PasswordHash"]?.ToString() ?? string.Empty;
                            bool passwordCorrecto = BCrypt.Net.BCrypt.Verify(password, hashAlmacenado);

                            if (passwordCorrecto)
                            {
                                return new Usuario
                                {
                                    Nombre = reader["Nombre"].ToString(),
                                    Email = reader["Email"].ToString()
                                };
                            }
                        }
                    }
                }
            }
            return null;
        }
    }
}