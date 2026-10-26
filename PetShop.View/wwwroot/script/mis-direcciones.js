let modalDireccionInstancia;
let usuarioIdActual = 0;
let listaDirecciones = [];

window.onload = function () {
    const sessionStr = localStorage.getItem('user_session');
    if (!sessionStr) {
        window.location.replace("index.html");
        return;
    }
    const user = JSON.parse(sessionStr);
    usuarioIdActual = Number(user.id || user.UsuarioID || 0);

    modalDireccionInstancia = new bootstrap.Modal(document.getElementById('modalDireccion'));
    cargarMisDirecciones();
};

async function cargarMisDirecciones() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${CONFIG.API_BASE_URL}/Usuarios/direcciones/${usuarioIdActual}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        const contenedor = document.getElementById('contenedor-direcciones');
        contenedor.innerHTML = '';

        if (data.codigo === 1 && data.direcciones.length > 0) {
            listaDirecciones = data.direcciones;
            data.direcciones.forEach(dir => {
                const badgePrincipal = dir.esPrincipal
                    ? '<span class="badge bg-success mb-2"><i class="fas fa-star text-warning"></i> Principal</span>'
                    : '';

                contenedor.innerHTML += `
                    <div class="col-md-6 col-lg-4">
                        <div class="card h-100 shadow-sm border-0">
                            <div class="card-body p-4">
                                ${badgePrincipal}
                                <h5 class="fw-bold text-dark mb-1">${dir.alias || 'Dirección'}</h5>
                                <p class="text-muted small mb-3">${dir.direccionCompleta}</p>
                                <p class="text-muted small mb-0"><i class="fas fa-info-circle me-1"></i> ${dir.referencias || 'Sin referencias'}</p>
                            </div>
                            <div class="card-footer bg-white border-top-0 p-3 pt-0 text-end">
                                <button class="btn btn-sm btn-outline-primary fw-bold me-1" onclick="editarDireccion(${dir.direccionID})">Editar</button>
                                <button class="btn btn-sm btn-outline-danger fw-bold" onclick="eliminarDireccion(${dir.direccionID})">Eliminar</button>
                            </div>
                        </div>
                    </div>
                `;
            });
        } else {
            contenedor.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="alert alert-warning d-inline-block px-5 py-4 shadow-sm border-0">
                        <i class="fas fa-map-marker-alt fs-2 text-warning mb-3"></i>
                        <h5 class="fw-bold">No tienes direcciones guardadas</h5>
                        <p class="mb-0">Agrega una dirección para recibir tus productos.</p>
                    </div>
                </div>`;
        }
    } catch (e) {
        console.error(e);
        EnviarMensaje(-1, "Error al cargar las direcciones.");
    }
}

function abrirModalDireccion() {
    document.getElementById('form-direccion').reset();
    document.getElementById('dir-id').value = "0";
    document.getElementById('tituloModalDireccion').innerText = "Agregar Dirección";
    modalDireccionInstancia.show();
}

function editarDireccion(id) {
    const dir = listaDirecciones.find(d => d.direccionID === id);
    if (!dir) return;

    document.getElementById('dir-id').value = dir.direccionID;
    document.getElementById('dir-alias').value = dir.alias;
    document.getElementById('dir-completa').value = dir.direccionCompleta;
    document.getElementById('dir-referencias').value = dir.referencias;
    document.getElementById('dir-principal').checked = dir.esPrincipal;

    document.getElementById('tituloModalDireccion').innerText = "Editar Dirección";
    modalDireccionInstancia.show();
}

async function guardarDireccion() {
    const id = Number(document.getElementById('dir-id').value);
    const payload = {
        DireccionID: id,
        UsuarioID: usuarioIdActual,
        Alias: document.getElementById('dir-alias').value.trim(),
        DireccionCompleta: document.getElementById('dir-completa').value.trim(),
        Referencias: document.getElementById('dir-referencias').value.trim(),
        EsPrincipal: document.getElementById('dir-principal').checked
    };

    if (!payload.DireccionCompleta) {
        EnviarMensaje(0, "La dirección completa es obligatoria.");
        return;
    }

    const metodo = id === 0 ? 'POST' : 'PUT';
    const endpoint = id === 0 ? '/Usuarios/direcciones' : `/Usuarios/direcciones/${id}`;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (data.codigo === 1) {
            modalDireccionInstancia.hide();
            cargarMisDirecciones();
            EnviarMensaje(1, "Dirección guardada correctamente.");
        } else {
            EnviarMensaje(0, data.mensaje);
        }
    } catch (e) {
        EnviarMensaje(-1, "Error de conexión al guardar.");
    }
}

async function eliminarDireccion(id) {
    const confirmacion = await Swal.fire({
        title: '¿Eliminar dirección?',
        text: "No podrás revertir esta acción.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#212529',
        cancelButtonColor: '#dc3545',
        confirmButtonText: 'Sí, eliminar'
    });

    if (confirmacion.isConfirmed) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${CONFIG.API_BASE_URL}/Usuarios/direcciones/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.codigo === 1) {
                cargarMisDirecciones();
                EnviarMensaje(1, "Dirección eliminada.");
            } else {
                EnviarMensaje(0, data.mensaje);
            }
        } catch (e) {
            EnviarMensaje(-1, "Error al eliminar.");
        }
    }
}