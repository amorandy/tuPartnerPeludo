let modalDetalle;
let pedidoActualID = 0;
let todosLosPedidos = [];

// Validación de seguridad mediante API (igual a productos)
async function protegerRutaAdminPedidos() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/Usuarios/verificar-admin`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (response.status === 403 || response.status === 401) {
            window.location.replace('index.html');
        }
    } catch (error) {
        window.location.replace('index.html');
    }
}
protegerRutaAdminPedidos();

async function cargarTodosLosPedidos() {
    // Inicializar el modal cuando los componentes ya estén cargados
    const modalEl = document.getElementById('modalDetallePedido');
    if (modalEl) {
        modalDetalle = new bootstrap.Modal(modalEl);
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${CONFIG.API_BASE_URL}/Pedidos/todos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.codigo === 1) {
            todosLosPedidos = data.pedidos;
            renderizarTablaPedidos(todosLosPedidos);
        } else {
            document.getElementById('tabla-pedidos').innerHTML = `<tr><td colspan="6" class="text-center text-muted">${data.mensaje}</td></tr>`;
        }
    } catch (error) {
        document.getElementById('tabla-pedidos').innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error de conexión.</td></tr>';
    }
}

function renderizarTablaPedidos(lista) {
    const tbody = document.getElementById('tabla-pedidos');
    tbody.innerHTML = '';

    if (lista.length === 0) {
        // Asegúrate de que el colspan sea 7 ahora
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No se encontraron pedidos.</td></tr>';
        return;
    }

    lista.forEach(p => {
        let badgeClass = 'bg-warning text-dark';
        if (p.estado === 'Enviado') badgeClass = 'bg-info text-dark';
        if (p.estado === 'Entregado') badgeClass = 'bg-success';

        tbody.innerHTML += `
            <!-- FILA PRINCIPAL -->
            <tr class="align-middle">
                <td class="text-center">
                    <button class="btn btn-sm btn-light border-0 text-muted shadow-sm" onclick="toggleFilaDetalle(${p.pedidoID}, this)" style="border-radius: 50%; width: 30px; height: 30px; padding: 0;">
                        <i class="fas fa-chevron-right transition-icon"></i>
                    </button>
                </td>
                <td class="fw-bold text-primary">#${p.pedidoID}</td>
                <td>
                    <div class="fw-bold">${p.clienteNombre}</div>
                    <small class="text-muted">${p.clienteEmail}</small>
                </td>
                <td>${new Date(p.fecha).toLocaleDateString()}</td>
                <td class="fw-bold text-success">$${p.total.toLocaleString()}</td>
                <td><span class="badge ${badgeClass}">${p.estado}</span></td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary fw-bold" onclick="verDetallePedido(${p.pedidoID})">
                        <i class="fas fa-eye me-1"></i> Ver Detalle
                    </button>
                </td>
            </tr>
            <!-- FILA OCULTA DESPLEGABLE -->
            <tr id="fila-expandida-${p.pedidoID}" class="d-none" style="background-color: #f8f9fa;">
                <td colspan="7" class="p-0 border-bottom">
                    <div class="p-3 m-2 border rounded bg-white shadow-sm" id="contenido-expandido-${p.pedidoID}">
                        <div class="text-center text-muted small py-2">
                            <i class="fas fa-spinner fa-spin me-2"></i>Cargando detalles...
                        </div>
                    </div>
                </td>
            </tr>
        `;
    });
}

async function toggleFilaDetalle(pedidoId, btnElement) {
    const fila = document.getElementById(`fila-expandida-${pedidoId}`);
    const contenido = document.getElementById(`contenido-expandido-${pedidoId}`);
    const icono = btnElement.querySelector('i');

    if (fila.classList.contains('d-none')) {
        fila.classList.remove('d-none');
        icono.classList.replace('fa-chevron-right', 'fa-chevron-down');

        if (contenido.dataset.cargado === "true") return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${CONFIG.API_BASE_URL}/Pedidos/detalle/${pedidoId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            const p = data.data || data.pedido;

            if ((data.codigo === 1 || data.salida?.codigo === 1) && p) {
                let itemsHTML = '';
                p.detalles.forEach(item => {
                    itemsHTML += `
                        <tr class="align-middle">
                            <td class="text-start text-muted small fw-bold">${item.productoNombre}</td>
                            <td class="text-center small">${item.cantidad}</td>
                            <td class="text-end small">$${item.precioUnitario.toLocaleString()}</td>
                            <td class="text-end fw-bold small text-dark">$${(item.cantidad * item.precioUnitario).toLocaleString()}</td>
                        </tr>
                    `;
                });

                const aliasDir = p.alias ? ` <strong>${p.alias}, </strong>` : "";

                contenido.innerHTML = `
                    <div class="row px-2 align-items-center">
                        <div class="col-md-4 border-end mb-3 mb-md-0">
                            <h6 class="text-uppercase text-muted fw-bold mb-2" style="font-size: 0.75rem;">Resumen de Envío</h6>
                            <p class="mb-1 small"><strong>Método:</strong> ${p.metodoPago || 'No especificado'}</p>
            
                            <p class="mb-0 small text-muted">
                                <i class="fas fa-map-marker-alt me-1"></i> ${aliasDir + (p.direccionCompleta || 'Retiro en tienda')}
                            </p>
                        </div>
                        <div class="col-md-8">
                            <table class="table table-sm table-borderless table-striped mb-0">
                                <!-- ... resto de tu tabla (thead y tbody) ... -->
                                <thead class="border-bottom">
                                    <tr class="text-muted small text-uppercase">
                                        <th class="text-start py-2">Producto</th>
                                        <th class="text-center py-2">Cant.</th>
                                        <th class="text-end py-2">Precio</th>
                                        <th class="text-end py-2">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsHTML}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
                contenido.dataset.cargado = "true";
            } else {
                contenido.innerHTML = `<div class="text-danger text-center small py-2">Error al cargar: ${data.mensaje}</div>`;
            }
        } catch (error) {
            contenido.innerHTML = `<div class="text-danger text-center small py-2">Error de conexión al obtener el detalle.</div>`;
        }
    } else {
        fila.classList.add('d-none');
        icono.classList.replace('fa-chevron-down', 'fa-chevron-right');
    }
}

function filtrarPedidos(estado, botonElement) {
    document.querySelectorAll('#grupo-filtros button').forEach(btn => {
        btn.classList.remove('btn-dark');
        btn.classList.add('btn-outline-dark');
    });
    botonElement.classList.remove('btn-outline-dark');
    botonElement.classList.add('btn-dark');

    document.getElementById('buscador-pedidos').value = '';

    if (estado === 'Todos') {
        renderizarTablaPedidos(todosLosPedidos);
    } else {
        const filtrados = todosLosPedidos.filter(p => p.estado === estado);
        renderizarTablaPedidos(filtrados);
    }
}

function ejecutarBusqueda() {
    const texto = document.getElementById('buscador-pedidos').value.toLowerCase();

    document.querySelectorAll('#grupo-filtros button').forEach(btn => {
        btn.classList.replace('btn-dark', 'btn-outline-dark');
    });
    document.querySelector('#grupo-filtros button').classList.replace('btn-outline-dark', 'btn-dark');

    const filtrados = todosLosPedidos.filter(p =>
        p.clienteNombre.toLowerCase().includes(texto) ||
        p.clienteEmail.toLowerCase().includes(texto) ||
        p.pedidoID.toString().includes(texto)
    );
    renderizarTablaPedidos(filtrados);
}

async function verDetallePedido(pedidoId) {
    pedidoActualID = pedidoId;
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${CONFIG.API_BASE_URL}/Pedidos/detalle/${pedidoId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.salida.codigo === 1) {
            const p = data.pedido;

            document.getElementById('lbl-pedido-id').innerText = p.pedidoID;
            document.getElementById('lbl-cliente-nombre').innerText = p.clienteNombre;
            document.getElementById('lbl-cliente-email').innerText = p.clienteEmail;

            document.getElementById('lbl-metodo-pago').innerText = p.metodoPago || "No especificado";
            const aliasDir = p.alias ? ` (${p.alias})` : "";
            document.getElementById('lbl-direccion').innerText = (p.direccionCompleta || "Retiro en tienda") + aliasDir;
            document.getElementById('lbl-referencias').innerText = p.referencias || "";

            document.getElementById('lbl-estado').innerText = p.estado;
            document.getElementById('select-estado').value = p.estado;
            document.getElementById('lbl-total').innerText = `$${p.total.toLocaleString()}`;

            const tbodyDetalles = document.getElementById('tabla-detalles');
            tbodyDetalles.innerHTML = '';
            let totalCalculado = 0;

            p.detalles.forEach(item => {
                const subtotal = item.cantidad * item.precioUnitario;
                totalCalculado += subtotal;

                tbodyDetalles.innerHTML += `
                    <tr>
                        <td class="text-start">${item.productoNombre}</td>
                        <td>${item.cantidad}</td>
                        <td>$${item.precioUnitario.toLocaleString()}</td>
                        <td class="text-end">$${subtotal.toLocaleString()}</td>
                    </tr>
                `;
            });

            document.getElementById('lbl-total').innerText = `$${totalCalculado.toLocaleString()}`;
            if (modalDetalle) modalDetalle.show();
        } else {
            EnviarMensaje(0, data.mensaje || "No se pudo cargar el detalle");
        }
    } catch (error) {
        EnviarMensaje(-1, "Error al conectar con el servidor.");
    }
}

async function actualizarEstadoPedido() {
    const nuevoEstado = document.getElementById('select-estado').value;
    const confirmacion = await Confirmar(`¿Cambiar pedido #${pedidoActualID} a '${nuevoEstado}'?`);

    if (!confirmacion) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${CONFIG.API_BASE_URL}/Pedidos/actualizar-estado`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ pedidoID: pedidoActualID, estado: nuevoEstado })
        });

        const data = await response.json();

        if (data.codigo === 1) {
            EnviarMensaje(1, "Estado actualizado correctamente");
            modalDetalle.hide();
            cargarTodosLosPedidos();
        } else {
            EnviarMensaje(0, data.mensaje);
        }
    } catch (error) {
        EnviarMensaje(-1, "Error al actualizar el estado.");
    }
}