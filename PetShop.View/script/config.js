const CONFIG = {
    URL_LOCAL: "http://localhost:5175/api",
    URL_PRODUCCION: "https://tupartnerpeludo.onrender.com/api",
    get API_BASE_URL() {
        const hostname = window.location.hostname;
        if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "") {
            console.log("Modo Desarrollo: Usando URL Local");
            return this.URL_LOCAL;
        } else {
            console.log("Modo Producción: Usando URL Producción");
            return this.URL_PRODUCCION;
        }
    }
};