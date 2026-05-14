const response = `${CONFIG.API_BASE_URL}/api`;

const pass1 = document.getElementById('pass1');
const pass2 = document.getElementById('pass2');
const btn = document.getElementById('btnGuardar');

// Capturar el TOKEN de la URL (?token=xxxx)
const urlParams = new URLSearchParams(window.location.search);
const tokenActual = urlParams.get('token');

const validarPassword = () => {
    const val = pass1.value;
    
    // Reglas
    const reglas = {
        mayus: /[A-Z]/.test(val),
        minus: /[a-z]/.test(val),
        numero: /\d/.test(val),
        largo: val.length >= 8
    };

    // Actualizar vista de checks
    actualizarCheck("check-mayus", reglas.mayus);
    actualizarCheck("check-minus", reglas.minus);
    actualizarCheck("check-numero", reglas.numero);
    actualizarCheck("check-largo", reglas.largo);

    // Validar coincidencia
    const coinciden = val === pass2.value && val !== "";
    document.getElementById('check-coincide').classList.toggle('d-none', coinciden || pass2.value === "");
    
    // Habilitar botón solo si todo es correcto
    btn.disabled = !(reglas.mayus && reglas.minus && reglas.numero && reglas.largo && coinciden);
};

function actualizarCheck(id, cumple) {
    const el = document.getElementById(id);
    if (cumple) {
        el.classList.replace('text-danger', 'text-success');
        el.innerText = "✓ " + el.innerText.substring(2);
    } else {
        el.classList.replace('text-success', 'text-danger');
        el.innerText = "✕ " + el.innerText.substring(2);
    }
}

// Eventos de teclado
pass1.addEventListener('input', validarPassword);
pass2.addEventListener('input', validarPassword);

// Envio al Backend (C#)
document.getElementById('formRestablecer').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!tokenActual) {
        alert("Token no encontrado. Por favor, solicita un nuevo enlace.");
        return;
    }

    try {
        const urlFinal = `${CONFIG.API_BASE_URL}/usuarios/restablecer-final`;
        const response = await fetch(urlFinal, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                token: tokenActual, 
                nuevaPassword: pass1.value 
            })
        });

        const data = await response.json();
        
        if (data.codigo === 1) {
            alert("¡Contraseña actualizada! Serás redirigido al login.");
            window.location.href = "index.html"; // Redirigir al inicio
        } else {
            alert(data.mensaje);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error de conexión con el servidor.");
    }
});