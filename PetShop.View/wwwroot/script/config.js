const CONFIG = {
    URL_LOCAL: "http://localhost:5175/api",
    URL_PRODUCCION: "https://tupartnerpeludo.onrender.com/api",
    get API_BASE_URL() {
        const hostname = window.location.hostname;
        if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "") {
            return this.URL_LOCAL;
        } else {
            return this.URL_PRODUCCION;
        }
    }
};