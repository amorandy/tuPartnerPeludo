let listaUsuariosGlobal = [];

async function alternarBloqueo(id, actualmenteBloqueado) {
    const accion = actualmenteBloqueado ? "desbloquear" : "bloquear";
    const confirmacion = await Confirmar(`¿Estás seguro de que deseas ${accion} a este usuario?`);

    if (confirmacion) {
        try {
            const token = localStorage.getItem('token');
            const url = `${CONFIG.API_BASE_URL}/Usuarios/bloquear-usuario/${id}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log(response);
            if (response.ok) {
                EnviarMensaje(1, `Usuario ${accion}do correctamente`);
                renderizarTablaUsuarios();
            } else {
                EnviarMensaje(0, `Error al ${accion} al usuario`);
            }
        } catch (error) {
            EnviarMensaje(0, "Error de conexión con el servidor");
        }
    }
}

async function cambiarRol(id) {
    const roles = {
        'admin': 'Administrador',
        'cliente': 'Cliente'
    };

    const { value: nuevoRol } = await Swal.fire({
        title: 'Seleccionar nuevo rol',
        input: 'select',
        inputOptions: roles,
        inputPlaceholder: 'Selecciona un rol',
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar'
    });

    if (nuevoRol) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/Usuarios/cambiar-rol/${id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(nuevoRol)
            });
            const data = await response.json();
            if (data.salida.codigo === 1) {
                renderizarTablaUsuarios();
            }
            ProcesarRespuesta(data.salida);
        } catch (error) {
            EnviarMensaje(-1,"Error de comunicación con el servidor");
        }
    }
}

async function renderizarTablaUsuarios() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/Usuarios`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        listaUsuariosGlobal = data.usuarios || [];
        mostrarTabla(listaUsuariosGlobal);
        if (data.codigo === 0) ProcesarRespuesta(data);
    } catch (error) {
        EnviarMensaje(-1, "Error al cargar usuarios");
    }
}
function mostrarTabla(lista) {
    const contenedor = document.getElementById('lista-usuarios');
    contenedor.innerHTML = '';
    lista.forEach(u => {
        const esBloqueado = u.isBloqueado;
        console.log(esBloqueado);
        const badgeEstado = esBloqueado
            ? '<span class="badge bg-danger">Bloqueado</span>'
            : '<span class="badge bg-success">Activo</span>';

        const badgeRol = u.rol === 'admin'
            ? '<span class="badge bg-primary">Admin</span>'
            : '<span class="badge bg-secondary">Cliente</span>';
        contenedor.innerHTML += `
            <tr>
                <td>${u.nombre} ${u.apellido}</td>
                <td>${u.email}</td>
                <td>${badgeRol}</td>
                <td>${badgeEstado}</td>
                <td>
                    <button class="btn btn-sm btn-outline-warning" onclick="cambiarRol(${u.usuarioID})">Rol</button>
                    <button class="btn btn-sm ${esBloqueado ? 'btn-outline-success' : 'btn-outline-danger'}" 
                            onclick="alternarBloqueo(${u.usuarioID}, ${esBloqueado})">
                        ${esBloqueado ? 'Desbloquear' : 'Bloquear'}
                    </button>
                </td>
            </tr>
        `;
    });
}
function filtrarUsuarios(event) {
    const input = document.getElementById('inputBusqueda');
    const texto = event.target.value.toLowerCase().trim();
    if (texto === "") {
        mostrarTabla(listaUsuariosGlobal);
    } else {
        const filtrados = listaUsuariosGlobal.filter(u =>
            (u.nombre && u.nombre.toLowerCase().includes(texto)) ||
            (u.email && u.email.toLowerCase().includes(texto))
        );
        mostrarTabla(filtrados);
    }
}

async function initApp() {
    await Promise.all([
        fetch('components/navbar.html').then(r => r.text()).then(html => document.getElementById('layout-navbar').innerHTML = html),
        fetch('components/sidebar.html').then(r => r.text()).then(html => document.getElementById('layout-sidebar').innerHTML = html)
    ]);
    if (typeof renderizarTablaUsuarios === 'function') {
        renderizarTablaUsuarios();
    }
}
initApp();