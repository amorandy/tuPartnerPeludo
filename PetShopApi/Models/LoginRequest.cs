using System.Text.Json.Serialization;
namespace PetShopApi.Models
{
    public class LoginRequest
    {
        [JsonPropertyName("Email")]
        public string? Email { get; set; }
        [JsonPropertyName("Password")]
        public string? Password { get; set; }
    }
}
