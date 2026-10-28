let idDireccionSeleccionada = null;
window.onload = async function () {
    const sessionStr = localStorage.getItem('user_session');
    if (!sessionStr) {
        window.location.href = "index.html";
        return;
    }

    const user = JSON.parse(sessionStr);
    document.getElementById('chk-nombre').innerText = user.nombre;
    document.getElementById('chk-email').innerText = user.email;

    await cargarResumenCarrito(user.id);
    await cargarDirecciones(user.id);
};

async function cargarResumenCarrito(usuarioId) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/Pedidos/carrito/${usuarioId}`);
        const data = await response.json();

        const lista = document.getElementById('chk-lista-productos');
        lista.innerHTML = '';

        if (data.items && data.items.length > 0) {
            data.items.forEach(item => {
                const nombre = item.productoNombre || item.nombreProducto || 'Producto';
                const precio = item.precioUnitario || item.precio || 0;
                const subtotalItem = item.cantidad * precio;

                lista.innerHTML += `
                    <li class="list-group-item d-flex justify-content-between lh-sm p-3">
                        <div>
                            <h6 class="my-0 text-truncate" style="max-width: 200px;">${nombre}</h6>
                            <small class="text-muted">Cant: ${item.cantidad}</small>
                        </div>
                        <span class="text-muted">$${subtotalItem.toLocaleString()}</span>
                    </li>
                `;
            });

            document.getElementById('chk-subtotal').innerText = `$${data.subtotal.toLocaleString()}`;
            document.getElementById('chk-impuesto').innerText = `$${data.impuesto.toLocaleString()}`;
            document.getElementById('chk-total').innerText = `$${data.total.toLocaleString()}`;
        }
    } catch (e) {
        console.error("Error cargando carrito", e);
    }
}
async function cargarDirecciones(usuarioId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${CONFIG.API_BASE_URL}/Usuarios/direcciones/${usuarioId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        const contenedor = document.getElementById('contenedor-direcciones');
        contenedor.innerHTML = '';

        const lista = data.direcciones || data.Direcciones || [];

        if (lista.length > 0) {
            lista.forEach(dir => {
                const esPrincipal = dir.esPrincipal || dir.EsPrincipal;
                const checked = esPrincipal ? 'checked' : '';
                const bgClass = esPrincipal ? 'border-dark bg-light' : 'border-secondary opacity-75';

                const badge = esPrincipal ? '<span class="badge bg-success mb-2">Principal</span>' : '';
                const alias = dir.alias || dir.Alias || 'Dirección';
                const idDir = dir.direccionID || dir.DireccionID;

                if (esPrincipal) {
                    idDireccionSeleccionada = idDir;
                }

                contenedor.innerHTML += `
                    <div class="col-md-6 mb-3">
                        <div class="card p-3 h-100 direccion-card ${bgClass}" style="cursor: pointer;" onclick="seleccionarDireccion(this, ${idDir})">
                            ${badge}
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="direccionEnvio" value="${idDir}" ${checked} onclick="event.stopPropagation(); seleccionarDireccion(this.closest('.direccion-card'), ${idDir})">
                                <label class="form-check-label fw-bold">${alias}</label>
                            </div>
                            <p class="small text-muted mt-2 mb-1">${dir.direccionCompleta || dir.DireccionCompleta}</p>
                            <p class="small text-muted mb-0"><i class="fas fa-info-circle"></i> ${dir.referencias || dir.Referencias || 'Sin referencias'}</p>
                        </div>
                    </div>
                `;
            });
        } else {
            contenedor.innerHTML = `
                <div class="col-12 text-center py-4">
                    <div class="alert alert-warning mb-0 border-0 shadow-sm">
                        No tienes direcciones guardadas. Por favor agrega una.
                    </div>
                </div>`;
        }
    } catch (e) {
        EnviarMensaje(-1, "Error cargando direcciones: " || e);
        document.getElementById('contenedor-direcciones').innerHTML = '<div class="alert alert-danger">Error al cargar direcciones</div>';
    }
}

function seleccionarDireccion(cardElement, direccionId) {
    document.querySelectorAll('.direccion-card').forEach(c => {
        c.classList.remove('border-dark', 'bg-light');
        c.classList.add('border-secondary', 'opacity-75');
    });

    cardElement.classList.remove('border-secondary', 'opacity-75');
    cardElement.classList.add('border-dark', 'bg-light');

    cardElement.querySelector('input[type="radio"]').checked = true;
}

function seleccionarDireccion(cardElement, direccionId) {
    document.querySelectorAll('.direccion-card').forEach(c => c.classList.remove('selected'));
    cardElement.classList.add('selected');
    cardElement.querySelector('input[type="radio"]').checked = true;
}

async function confirmarCompra() {
    const sessionStr = localStorage.getItem('user_session');
    if (!sessionStr) {
        EnviarMensaje(0, "Debes iniciar sesión para realizar la compra.");
        setTimeout(() => window.location.href = "index.html", 2000);
        return;
    }

    const userSession = JSON.parse(sessionStr);
    const idUsuarioLogueado = userSession.id;

    if (!idDireccionSeleccionada) {
        EnviarMensaje(0, "Por favor selecciona una dirección de envío.");
        return;
    }

    const requestBody = {
        usuarioID: idUsuarioLogueado,
        direccionID: idDireccionSeleccionada,
        metodoPago: document.getElementById('metodo-pago').value
    };

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${CONFIG.API_BASE_URL}/Pedidos/procesar-checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (data.codigo === 1) {
            const pedidoId = data.data.pedidoID;

            if (requestBody.metodoPago === 'transferencia') {
                window.location.href = `pago-transferencia.html?pedido=${pedidoId}`;
            } else if (requestBody.metodoPago === 'webpay') {
                window.location.href = `pago-webpay.html?pedido=${pedidoId}`;
            } else if (requestBody.metodoPago === 'mercadopago') {
                window.location.href = `pago-mercadopago.html?pedido=${pedidoId}`;
            } else {
                window.location.href = `pago-transferencia.html?pedido=${pedidoId}`;
            }
        } else {
            EnviarMensaje(0, data.mensaje || "Error al procesar el pedido.");
        }
    } catch (error) {
        EnviarMensaje(-1, "Error de conexión al procesar el pago.");
    }
}

function seleccionarDireccion(cardElement, direccionId) {
    document.querySelectorAll('.direccion-card').forEach(c => c.classList.remove('selected', 'border-dark', 'bg-light'));

    cardElement.classList.add('selected', 'border-dark', 'bg-light');
    cardElement.querySelector('input[type="radio"]').checked = true;

    idDireccionSeleccionada = direccionId;
}