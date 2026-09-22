const hostname = window.location.hostname;
const isLocal = hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.startsWith("192.168.") ||
    hostname === "";

const CONFIG = {
    // Reemplaza 5175 por el puerto exacto donde esté corriendo el Swagger de tu PetShopApi
    URL_LOCAL: "http://localhost:5175/api",
    URL_PRODUCCION: "https://tupartnerpeludo.onrender.com/api",

    get API_BASE_URL() {
        return isLocal ? this.URL_LOCAL : this.URL_PRODUCCION;
    }
};