const API_BASE_URL = "http://192.168.1.82:8080/api";
function decodeJwtResponse(token) {
    let base64Url = token.split('.')[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

function mostrarRegistro() {
    document.getElementById("login-section").classList.add("d-none");
    document.getElementById("register-section").classList.remove("d-none");
}

function mostrarLogin() {
    document.getElementById("register-section").classList.add("d-none");
    document.getElementById("login-section").classList.remove("d-none");
}

function mostrarSeccionPerfil() {
    const loginSection = document.getElementById("login-section");
    const userProfile = document.getElementById("user-profile");
    const registerSection = document.getElementById("register-section");

    if (loginSection && userProfile) {
        loginSection.classList.add("d-none");
        if (registerSection) registerSection.classList.add("d-none");
        userProfile.classList.remove("d-none");

        const sessionData = localStorage.getItem('user_session');

        if (sessionManual) {
            const data = JSON.parse(sessionManual);
            document.getElementById("user-name").innerText = data.nombre.toUpperCase();
            document.getElementById("user-img").src = data.foto || "images/default-user.png";
        }
        const logo = document.getElementById("main-logo");
        if (logo) logo.style.maxWidth = "80px";
    }
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

window.onload = function () {
    const googleToken = localStorage.getItem('google_token');
    const sessionManual = localStorage.getItem('user_session');

    if (googleToken || sessionManual) {
        mostrarSeccionPerfil(); 
    }

    google.accounts.id.initialize({
        itp_support: true,
        client_id: "85108018661-r3dis4gm7h25kg9or2fnnpckhme87raj.apps.googleusercontent.com",
        callback: handleCredentialResponse
    });

    google.accounts.id.renderButton(
        document.getElementById("buttonDiv"),
        { theme: "outline", size: "large", width: "350", text: "signin_with", shape: "rectangular" }
    );
}

async function procesarRegistro(event) {
    event.preventDefault(); 

    const usuario = {
        nombre: document.getElementById("reg-nombre").value,
        apellido: document.getElementById("reg-apellido").value,
        email: document.getElementById("reg-email").value,
        password: document.getElementById("reg-password").value,
        telefono: document.getElementById("reg-telefono").value
    };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(usuario.email)) {
        EnviarMensaje(0, "Por favor, ingresa un correo válido.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/usuarios/registrar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(usuario)
        });

        const data = await response.json();

        MostrarSalidas(data);


        if (response.ok && data.codigo === 1) {
            localStorage.setItem('email_pendiente', usuario.email);

            // 2. Ocultamos el formulario de registro y mostramos el de verificación
            document.getElementById("formRegistro").style.display = "none";
            document.getElementById("seccion-verificacion").style.display = "block";

            EnviarMensaje(1, "¡Código enviado! Por favor revisa tu WhatsApp.");

            //setTimeout(() => {
            //    document.getElementById("formRegistro").reset();
            //    mostrarLogin();
            //}, 2500);
        }
    } catch (error) {
        console.error("Error de conexión:", error);
        MostrarSalidas({ cpSalidas: [{ Codigo: -1, Mensaje: "No se pudo conectar con el servidor." }] });
    }
}

async function confirmarCodigo() {
    const email = localStorage.getItem('email_pendiente');
    const codigo = document.getElementById("codigo-verificacion").value;

    if (codigo.length < 6) {
        EnviarMensaje(0, "Por favor, ingresa los 6 dígitos.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/usuarios/verificar-codigo`, {
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
        const response = await fetch(`${API_BASE_URL}/usuarios/login`, {
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
