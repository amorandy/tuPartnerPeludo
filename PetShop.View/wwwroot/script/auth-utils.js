// auth-utils.js

function parseJwt(token) {
    if (!token) return null;
    try {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(window.atob(base64));
    } catch (e) {
        EnviarMensaje(-1, "Error al decodificar el token: " + e)
        console.error("Error al decodificar el token:", e);
        return null;
    }
}

function initAuth(onAuthenticatedCallback) {
    const userSession = localStorage.getItem('user_session');

    if (!userSession) {
        EnviarMensaje(-1, "No hay sesión activa. Redirigiendo al login...");
        console.warn("No hay sesión activa. Redirigiendo al login...");
        window.location.replace("index.html");
        return;
    }

    if (onAuthenticatedCallback) {
        try {
            const data = JSON.parse(userSession);
            onAuthenticatedCallback(data);
        } catch (e) {
            EnviarMensaje(-1, "Error al parsear user_session: " + e);
            logout();
        }
    }
}

const token = localStorage.getItem('token');
fetch(`${CONFIG.API_BASE_URL}/usuarios/validar-token?token=${token}`)
    .then(res => res.json())
    .then(data => {
        if (data.salida && data.salida.codigo === 0) {
            logout();
        }
    });

async function logout() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            await fetch(`${CONFIG.API_BASE_URL}/usuarios/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(token) // Asegúrate de que el endpoint lo reciba correctamente
            });
        } catch (e) { console.error(e); }
    }
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
        if (session.rol !== 'admin') {
            window.location.replace("main.html");
        }
    } catch (e) {
        console.error("Error verificando rol de admin:", e);
        window.location.replace("index.html");
    }
}

// ELIMINAMOS la llamada global a protegerRutaAdmin() de la línea 36
// protegerRutaAdmin(); <-- Esto causaba problemas si se incluía en main.html
