document.addEventListener('DOMContentLoaded', () => {
    cargarDatosPerfil();
    cargarDirecciones();

    // Eventos de formularios
    const formPerfil = document.getElementById('form-perfil');
    if (formPerfil) {
        formPerfil.addEventListener('submit', guardarCambiosPerfil);
    }

    const formDireccion = document.getElementById('form-nueva-direccion');
    if (formDireccion) {
        formDireccion.addEventListener('submit', guardarNuevaDireccion);
    }
});

// Helper para obtener usuarioId y token de forma segura
function obtenerDatosSesion() {
    const sessionStr = localStorage.getItem('user_session') || '{}';
    const session = JSON.parse(sessionStr);
    const usuarioId = Number(session.id || session.UsuarioId || session.UsuarioID || session.usuarioId || 0);
    const token = localStorage.getItem('token');
    return { session, usuarioId, token };
}

// ==========================================
// 1. INFORMACIONES GENERALES
// ==========================================
async function cargarDatosPerfil() {
    const { session, usuarioId, token } = obtenerDatosSesion();
    if (usuarioId === 0 || !token) return;

    // Precarga rápida desde localStorage mientras responde la API
    if (session.nombre) document.getElementById('perfil-nombre').value = session.nombre;
    if (session.email) document.getElementById('perfil-email').value = session.email;

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/Usuarios/${usuarioId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) return;

        const data = await response.json();
        const usuario = data.data || data.salida?.data || data;

        if (usuario) {
            document.getElementById('perfil-nombre').value = usuario.nombre || usuario.Nombre || '';
            document.getElementById('perfil-apellido').value = usuario.apellido || usuario.Apellido || '';
            document.getElementById('perfil-email').value = usuario.email || usuario.Email || session.email || '';
            document.getElementById('perfil-telefono').value = usuario.telefono || usuario.Telefono || '';

            const fotoUrl = usuario.fotoUrl || usuario.FotoUrl;
            if (fotoUrl) {
                document.getElementById('preview-foto-perfil').src = fotoUrl;
                const iconoNav = document.getElementById('icono-usuario');
                if (iconoNav) iconoNav.src = fotoUrl;
            }
        }
    } catch (error) {
        EnviarMensaje(-1, "Error al cargar los datos del perfil: " + error);
    }
}

async function guardarCambiosPerfil(e) {
    e.preventDefault();
    const { session, usuarioId, token } = obtenerDatosSesion();
    if (usuarioId === 0 || !token) return;

    const btnGuardar = document.getElementById('btn-guardar-perfil');
    const textoOriginal = btnGuardar.innerHTML;
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Guardando...';

    const payload = {
        Id: usuarioId,
        Nombre: document.getElementById('perfil-nombre').value.trim(),
        Apellido: document.getElementById('perfil-apellido').value.trim(),
        Telefono: document.getElementById('perfil-telefono').value.trim()
    };

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/Usuarios/actualizar-perfil`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        const salida = data.salida || data;

        if (response.ok && (salida.codigo === 1 || data.codigo === 1)) {
            EnviarMensaje(1, salida.mensaje || "Perfil actualizado correctamente.");

            // Actualizamos el nombre en localStorage y en el navbar
            session.nombre = payload.Nombre;
            localStorage.setItem('user_session', JSON.stringify(session));
            const navName = document.getElementById('user-name');
            if (navName) navName.innerText = payload.Nombre;
        } else {
            EnviarMensaje(0, salida.mensaje || "No se pudo actualizar el perfil.");
        }
    } catch (error) {
        EnviarMensaje(-1, "Error al guardar el perfil: " + error);
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = textoOriginal;
    }
}

function iniciarVerificacionTelefono() {
    const telefono = document.getElementById('perfil-telefono').value.trim();
    if (!telefono) {
        EnviarMensaje(0, "Ingresa un número de teléfono antes de verificar.");
        return;
    }
    // Aquí luego conectaremos el envío de código por WhatsApp/SMS
    EnviarMensaje(1, "Enviando código de verificación al +56 " + telefono + "...");
}

// ==========================================
// 2. GESTIÓN DE DIRECCIONES
// ==========================================
function abrirModalDirecciones() {
    const modalEl = document.getElementById('modalDirecciones');
    if (modalEl) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
        cargarDirecciones();
    }
}

async function cargarDirecciones() {
    const { usuarioId, token } = obtenerDatosSesion();
    if (usuarioId === 0 || !token) return;

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/Usuarios/direcciones/${usuarioId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) return;

        const data = await response.json();
        const direcciones = data.data || data.direcciones || (Array.isArray(data) ? data : []);

        renderizarDireccionPrincipal(direcciones);
        renderizarListaDireccionesModal(direcciones);
    } catch (error) {
        console.error("Error cargando direcciones:", error);
    }
}

function renderizarDireccionPrincipal(direcciones) {
    const calleEl = document.getElementById('dir-principal-calle');
    const comunaEl = document.getElementById('dir-principal-comuna');

    if (!direcciones || direcciones.length === 0) {
        calleEl.innerText = "Aún no tienes una dirección registrada.";
        comunaEl.innerText = "Haz clic en Gestionar Direcciones para agregar una.";
        return;
    }

    const principal = direcciones.find(d => d.esPrincipal || d.EsPrincipal) || direcciones[0];
    const alias = principal.alias || principal.Alias || 'Dirección';
    const completa = principal.direccionCompleta || principal.DireccionCompleta || '';
    const ref = principal.referencias || principal.Referencias || '';

    calleEl.innerText = `${alias}: ${completa}`;
    comunaEl.innerText = ref ? `Ref: ${ref}` : '';
}

function renderizarListaDireccionesModal(direcciones) {
    const contenedor = document.getElementById('lista-direcciones');
    if (!contenedor) return;

    if (!direcciones || direcciones.length === 0) {
        contenedor.innerHTML = '<p class="text-muted small text-center py-3">No tienes direcciones guardadas aún.</p>';
        return;
    }

    contenedor.innerHTML = direcciones.map(dir => {
        const id = dir.direccionID || dir.DireccionID;
        const alias = dir.alias || dir.Alias || 'Sin alias';
        const completa = dir.direccionCompleta || dir.DireccionCompleta || '';
        const ref = dir.referencias || dir.Referencias || '';
        const esPrincipal = dir.esPrincipal || dir.EsPrincipal;

        return `
            <div class="d-flex justify-content-between align-items-center p-3 mb-2 bg-light rounded-3 border">
                <div>
                    ${esPrincipal ? '<span class="badge bg-dark me-2">Principal</span>' : ''}
                    <span class="fw-bold small">${alias}</span>
                    <div class="small">${completa}</div>
                    ${ref ? `<div class="text-muted small">Ref: ${ref}</div>` : ''}
                </div>
                <button type="button" class="btn btn-outline-danger btn-sm rounded-pill" onclick="eliminarDireccion(${id}, this)">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
    }).join('');
}

async function guardarNuevaDireccion(e) {
    e.preventDefault();
    const { usuarioId, token } = obtenerDatosSesion();
    if (usuarioId === 0 || !token) return;

    const btnSubmit = e.target.querySelector('button[type="submit"]');
    const textoOriginal = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Guardando...';

    const payload = {
        DireccionID: 0,
        UsuarioID: usuarioId,
        Alias: document.getElementById('dir-alias').value.trim(),
        DireccionCompleta: document.getElementById('dir-completa').value.trim(),
        Referencias: document.getElementById('dir-referencias').value.trim(),
        EsPrincipal: document.getElementById('dir-es-principal').checked
    };

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/Usuarios/direcciones`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        const codigo = data.codigo ?? data.Codigo;
        const mensaje = data.mensaje ?? data.Mensaje;

        if (response.ok && codigo === 1) {
            EnviarMensaje(1, mensaje || "Dirección guardada.");
            e.target.reset();
            await cargarDirecciones();
        } else {
            EnviarMensaje(0, mensaje || "No se pudo guardar la dirección.");
        }
    } catch (error) {
        EnviarMensaje(-1, "Error al guardar dirección: " + error);
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = textoOriginal;
    }
}

async function eliminarDireccion(direccionId, boton) {
    const { token } = obtenerDatosSesion();
    if (!token) return;

    const textoOriginal = boton.innerHTML;
    boton.disabled = true;
    boton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/Usuarios/direcciones/${direccionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            EnviarMensaje(1, "Dirección eliminada.");
            await cargarDirecciones();
        } else {
            EnviarMensaje(0, "No se pudo eliminar la dirección.");
            boton.disabled = false;
            boton.innerHTML = textoOriginal;
        }
    } catch (error) {
        EnviarMensaje(-1, "Error al eliminar dirección: " + error);
        boton.disabled = false;
        boton.innerHTML = textoOriginal;
    }
}

// ==========================================
// 3. FOTO DE PERFIL (PREVISUALIZACIÓN)
// ==========================================
function previsualizarFoto(event) {
    const archivo = event.target.files[0];
    if (!archivo) return;

    if (archivo.size > 2 * 1024 * 1024) {
        EnviarMensaje(0, "La imagen supera el máximo permitido de 2MB.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        document.getElementById('preview-foto-perfil').src = e.target.result;
    };
    reader.readAsDataURL(archivo);
}