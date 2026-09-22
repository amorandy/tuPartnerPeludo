// auth-utils.js

function parseJwt(token) {
    if (!token) return null;
    try {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(window.atob(base64));
    } catch (e) {
        console.error("Error al decodificar el token:", e);
        return null;
    }
}

function initAuth(onAuthenticatedCallback) {
    // Ahora solo dependemos de user_session, ya que en index.js unificamos
    // el guardado (tanto para login normal como para Google) bajo esta clave.
    const userSession = localStorage.getItem('user_session');

    if (!userSession) {
        console.warn("No hay sesión activa. Redirigiendo al login...");
        window.location.replace("index.html");
        return;
    }

    if (onAuthenticatedCallback) {
        try {
            const data = JSON.parse(userSession);
            onAuthenticatedCallback(data);
        } catch (e) {
            console.error("Error al parsear user_session:", e);
            logout(); // Si la sesión está corrupta, cerramos sesión
        }
    }
}

function logout() {
    // Limpiamos todo el almacenamiento local para evitar rastros de la sesión anterior
    localStorage.clear();
    window.location.replace("index.html");
}

function protegerRutaAdmin() {
    const userSession = localStorage.getItem('user_session');

    if (!userSession) {
        window.location.replace("index.html");
        return;
    }

    try {
        const session = JSON.parse(userSession);
        // Validamos explícitamente el rol
        if (session.rol !== 'admin') {
            // Si no es admin, lo mandamos al main
            window.location.replace("main.html");
        }
    } catch (e) {
        console.error("Error verificando rol de admin:", e);
        window.location.replace("index.html");
    }
}

// ELIMINAMOS la llamada global a protegerRutaAdmin() de la línea 36
// protegerRutaAdmin(); <-- Esto causaba problemas si se incluía en main.html
