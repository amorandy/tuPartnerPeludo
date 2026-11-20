function parseJwt(token) {
    if (!token) return null;
    try {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(window.atob(base64));
    } catch (e) {
        EnviarMensaje(-1, "Error al decodificar el token: " + e)
        //console.error("Error al decodificar el token:", e);
        return null;
    }
}

function initAuth(onAuthenticatedCallback) {
    const userSession = localStorage.getItem('user_session');

    if (!userSession) {
        EnviarMensaje(-1, "No hay sesión activa. Redirigiendo al login...");
        //console.warn("No hay sesión activa. Redirigiendo al login...");
        window.location.replace("index.html");
        return;
    }

    if (onAuthenticatedCallback) {
        try {
            const data = JSON.parse(userSession);
            onAuthenticatedCallback(data);
        } catch (e) {
            EnviarMensaje(-1, "Error al parsear user_session: " + e);
            //console.error("Error al parsear user_session:", e);
            logout();
        }
    }
}

//const token = localStorage.getItem('token');
//fetch(`${CONFIG.API_BASE_URL}/usuarios/validar-token?token=${token}`)
//    .then(res => res.json())
//    .then(data => {
//        if (data.salida && data.salida.codigo === 0) {
//            EnviarMensaje(0, "Sesion Expirada");
//            logout();
//        }
//    });

async function logout() {
    localStorage.clear();
    window.location.replace("index.html");
}

async function realizarLogin(email, password) {
    const btnIniciar = document.querySelector("#formLogin button[type='submit']");
    btnIniciar.disabled = true;
    btnIniciar.innerText = "Iniciando Sesion...";
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/usuarios/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: password })
        });

        const data = await response.json();

        if (data.codigo === 1) {
            localStorage.setItem('token', data.token);
            const userSession = {
                id: data.id,
                email: data.email,
                nombre: data.user,
                rol: data.rol
            };
            localStorage.setItem('user_session', JSON.stringify(userSession));
            if (data.rol === 'admin') {
                window.location.href = "admin-productos.html";
                btnIniciar.innerText = "ACCESO ADMINISTRADOR";
            } else {
                window.location.href = "main.html";
            }
        } else {
            ProcesarRespuesta(data);
        }
    } catch (error) {
        EnviarMensaje(-1, "Error de conexión con el servidor" + error);
    }
    finally {
        btnIniciar.disabled = false;
        btnIniciar.innerText = "ENTRAR";
    }
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
        EnviarMensaje(-1, "Error verificando rol de admin: " + e);
        //console.error("Error verificando rol de admin:", e);
        window.location.replace("index.html");
    }
}
