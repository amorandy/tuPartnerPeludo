// PetShopApi/script/index.js

// NO declares CONFIG aquí, ya viene de config.js

function decodeJwtResponse(token) {
    let base64Url = token.split('.')[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

// Funciones de Navegación (Asegúrate de que coincidan con los IDs de tu HTML)
function mostrarRecuperar() {
    document.getElementById('login-section').classList.add('d-none');
    document.getElementById('register-section').classList.add('d-none');
    document.getElementById('recuperar-section').classList.remove('d-none');
}

function mostrarRegistro() {
    document.getElementById('login-section').classList.add('d-none');
    document.getElementById('recuperar-section').classList.add('d-none');
    document.getElementById('register-section').classList.remove('d-none');
}

function mostrarLogin() {
    document.getElementById('register-section').classList.add('d-none');
    document.getElementById('recuperar-section').classList.add('d-none');
    document.getElementById('user-profile').classList.add('d-none');
    document.getElementById('login-section').classList.remove('d-none');
}

function handleCredentialResponse(response) {
    const userData = decodeJwtResponse(response.credential);

    const sesionGoogle = {
        nombre: userData.name,
        foto: userData.picture,
        tipo: "google"
    };
    localStorage.setItem('user_session', JSON.stringify(sesionGoogle));
    localStorage.setItem('session_token', response.credential);

    mostrarSeccionPerfil();
}

async function confirmarCodigo() {
    const email = localStorage.getItem('email_pendiente');
    const codigo = document.getElementById("codigo-verificacion").value;

    if (codigo.length < 6) {
        EnviarMensaje(0, "Por favor, ingresa los 6 dígitos.");
        return;
    }

    try {
        const urlFinal = `${CONFIG.API_BASE_URL}/usuarios/verificar-codigo`;
        const response = await fetch(urlFinal, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, codigo: codigo })
        });

        const data = await response.json();

        if (response.ok && data.codigo === 1) {
            EnviarMensaje(1, "¡Cuenta verificada con éxito! Ya puedes iniciar sesión.");

            // Redirigir al login después de 2 segundos
            setTimeout(() => {
                location.reload(); // O tu función mostrarLogin()
            }, 2000);
        } else {
            EnviarMensaje(0, data.mensaje || "Código incorrecto.");
        }
    } catch (error) {
        console.error("Error:", error);
        EnviarMensaje(0, "Error de conexión al verificar.");
    }
}

document.getElementById('formLogin').addEventListener('submit', async (e) => {
e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPass').value;

    try {
        const urlFinal = `${CONFIG.API_BASE_URL}/usuarios/login`;
        const response = await fetch(urlFinal, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        MostrarSalidas(data);

        if (response.ok) {
            localStorage.setItem('session_token', data.token);

            const sesionManual = {
                nombre: data.user, 
                foto: data.foto || "images/default-user.png",
                tipo: "manual",
                token: data.token
            };
            
            localStorage.setItem('user_session', JSON.stringify(sesionManual));
            setTimeout(() => {
                window.location.replace("main.html");
            }, 1500);
        }
    } catch (error) {
        console.error("Error al conectar con la API:", error);
        MostrarSalidas({ cpSalidas: [{ Codigo: -1, Mensaje: "Error de conexión con el servidor" }] });
    }
});

async function procesarRegistro(event) {
    event.preventDefault(); 
    const telefonoRaw = document.getElementById("reg-telefono").value;
    const telefonoLimpio = telefonoRaw.replace(/\D/g, "");

    const usuario = {
        nombre: document.getElementById("reg-nombre").value,
        apellido: document.getElementById("reg-apellido").value,
        email: document.getElementById("reg-email").value,
        password: document.getElementById("reg-password").value,
        telefono: telefonoLimpio
    };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(usuario.email)) {
        EnviarMensaje(0, "Por favor, ingresa un correo válido.");
        return;
    }

    try {
        const urlFinal = `${CONFIG.API_BASE_URL}/usuarios/registrar`;
        const response = await fetch(urlFinal, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(usuario)
        });

        const data = await response.json();

        MostrarSalidas(data);

        if (response.ok && data.codigo === 1) {
            localStorage.setItem('email_pendiente', usuario.email);
            document.getElementById("formRegistro").style.display = "none";
            document.getElementById("seccion-verificacion").style.display = "block";
            EnviarMensaje(1, "¡Código enviado! Por favor revisa tu WhatsApp.");
        }
    } catch (error) {
        console.error("Error de conexión:", error);
        MostrarSalidas({ cpSalidas: [{ Codigo: -1, Mensaje: "No se pudo conectar con el servidor o servidor no disponible." }] });
    }
}

async function solicitarRecuperacion() {
    const telefonoInput = document.getElementById("recuperar-telefono");
    if (!telefonoInput) return;

    const telefono = telefonoInput.value;
    const telefonoLimpio = telefono.replace(/\D/g, "");

    try {
        const urlFinal = `${CONFIG.API_BASE_URL}/usuarios/solicitar-recuperacion`;
        const response = await fetch(urlFinal, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Telefono: telefonoLimpio })
        });

        if (response.ok) {
            EnviarMensaje(1, "Enlace de recuperación enviado por WhatsApp.");
        } else {
            EnviarMensaje(-1, "Error al enviar el enlace.");
        }
    } catch (error) {
        console.error("Error:", error);
        EnviarMensaje(-1, "No se pudo conectar con el servidor.");
    }
}

function irAlMain() { 
    window.location.href = "main.html"; 
}

function cerrarSesion() {
    localStorage.removeItem('google_token');
    localStorage.removeItem('user_session');
    localStorage.removeItem('session_token');
    window.location.href = "index.html";
}

function EnviarMensaje(codigo, mensaje) {
    toastr.options = {
        "closeButton": true,
        "progressBar": true,
        "positionClass": 'toast-bottom-right',
        "timeOut": "5000"
    };

    if (codigo <= -1) {
        toastr.error(mensaje);
    } else if (codigo === 0) {
        toastr.info(mensaje);
    } else if (codigo >= 1) {
        toastr.success(mensaje);
    }
}
function MostrarSalidas(s) {
    if (s && s.cpSalidas != null) {
        s.cpSalidas.forEach(salida => EnviarMensaje(salida.Codigo, salida.Mensaje));
        delete s.cpSalidas;
    } else if (s.codigo !== undefined) {
        EnviarMensaje(s.codigo, s.mensaje);
    }
}
