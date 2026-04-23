const API_BASE_URL = "https://witty-paws-cheat.loca.lt/api";
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
        password: document.getElementById("reg-password").value
    };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(usuario.email)) {
        alert("Por favor, ingresa un correo válido.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/usuarios/registrar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(usuario)
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('session_token', data.token);
            
            const sesionManual = {
                nombre: data.user || usuario.nombre, 
                foto: data.foto || "images/default-user.png",
                tipo: "manual"
            };
            localStorage.setItem('user_session', JSON.stringify(sesionManual));
            
            alert("¡Registro exitoso! Por favor, revisa tu bandeja de entrada y valida tu correo electrónico antes de iniciar sesión.");
            mostrarLogin();
            document.getElementById("formRegistro").reset();
        } else {
            alert("Error: " + data.mensaje);
        }
    } catch (error) {
        console.error("Error de conexión:", error);
        alert("No se pudo conectar con el servidor.");
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

        if (response.ok) {
            localStorage.setItem('session_token', data.token);

            const sesionManual = {
                nombre: data.user, 
                foto: data.foto || "images/default-user.png",
                tipo: "manual",
                token: data.token
            };
            
            localStorage.setItem('user_session', JSON.stringify(sesionManual));
            window.location.replace("main.html");
        } else {
            alert(data.mensaje || "Credenciales incorrectas");
        }
    } catch (error) {
        console.error("Error al conectar con la API:", error);
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
