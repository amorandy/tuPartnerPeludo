using MySqlConnector;

namespace PetShopApi.DAL
{
    public class ConexionFll
    {
        private readonly IConfiguration _configuration;

        public ConexionFll(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public MySqlConnection ObtenerConexion()
        {
            string? connectionString = _configuration.GetConnectionString("CleverCloudMySql");
            if (string.IsNullOrEmpty(connectionString))
            {
                throw new InvalidOperationException("La cadena de conexión 'CleverCloudMySql' no está configurada.");
            }
            return new MySqlConnection(connectionString);
        }
    }
}
