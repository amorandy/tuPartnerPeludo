document.addEventListener("DOMContentLoaded", async () => {
    const formRestablecer = document.getElementById('formRestablecer');
    const container = document.querySelector('.card');
    const urlParams = new URLSearchParams(window.location.search);
    const tokenActual = urlParams.get('token');

    if (!window.location.pathname.includes('reset-password.html')) return;

    // 1. Validación Inicial del Token
    if (!tokenActual) {
        EnviarMensaje(-1, "Token no encontrado. Solicita un nuevo enlace.");
        if (formRestablecer) formRestablecer.style.display = 'none';
        return;
    }

    try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/usuarios/validar-token?token=${encodeURIComponent(tokenActual)}`);
        
        if (!res.ok) {
            // Token inválido o expirado (código -1 para error rojo)
            EnviarMensaje(-1, "Este enlace ha caducado o no es válido.");
            if (formRestablecer) formRestablecer.style.display = 'none';
            return;
        }
        
        // Si todo está bien, mostramos un aviso informativo (código 0 para azul)
        EnviarMensaje(0, "Token validado. Por favor, ingresa tu nueva contraseña.");

    } catch (e) {
        EnviarMensaje(-1, "Error de conexión al validar el token.");
        if (formRestablecer) formRestablecer.style.display = 'none';
        return;
    }

    // --- LÓGICA DEL FORMULARIO (Si el token es válido) ---
    const pass1 = document.getElementById('pass1');
    const pass2 = document.getElementById('pass2');
    const btn = document.getElementById('btnGuardar');

    // ... (aquí mantienes tu lógica de validarPassword y los event listeners) ...

    formRestablecer.addEventListener('submit', async (e) => {
        e.preventDefault();
        btn.disabled = true;
        btn.innerText = "Guardando...";

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/usuarios/restablecer-final`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Token: tokenActual, NuevaPassword: pass1.value })
            });

            const data = await response.json();
            
            if (data.codigo === 1) {
                EnviarMensaje(1, "¡Contraseña actualizada correctamente!");
                setTimeout(() => window.location.href = "index.html", 2000);
            } else {
                EnviarMensaje(0, data.mensaje); // Azul informativo
                btn.disabled = false;
                btn.innerText = "Guardar Cambios";
            }
        } catch (error) {
            EnviarMensaje(-1, "Error al conectar con el servidor.");
            btn.disabled = false;
            btn.innerText = "Guardar Cambios";
        }
    });
});

function actualizarCheck(id, cumple) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.replace(cumple ? 'text-danger' : 'text-success', cumple ? 'text-success' : 'text-danger');
    el.innerHTML = (cumple ? "✓ " : "✕ ") + el.innerText.substring(2);
}