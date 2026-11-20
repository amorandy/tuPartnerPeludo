let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

async function agregarAlCarrito(productoId, boton) {
    // Guardamos el texto/ícono original del botón y lo bloqueamos
    const textoOriginal = boton ? boton.innerHTML : '';
    if (boton) {
        boton.disabled = true;
        boton.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Agregando...';
    }

    try {
        const sessionStr = localStorage.getItem('user_session') || '{}';
        const session = JSON.parse(sessionStr);
        const usuarioId = Number(session.id || session.UsuarioId || session.UsuarioID || session.usuarioId || 0);
        const token = localStorage.getItem('token') || sessionStr;

        if (usuarioId === 0) {
            EnviarMensaje(-1, "Debes iniciar sesión para agregar productos a tu carrito.");
            return;
        }

        const payload = {
            UsuarioID: usuarioId,
            ProductoID: productoId,
            Cantidad: 1
        };

        const response = await fetch(`${CONFIG.API_BASE_URL}/Pedidos/agregar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok && data.codigo === 1) {
            await refrescarTablaCarrito();
            if (typeof actualizarVistaCarrito === 'function') {
                await actualizarVistaCarrito();
            }
        } else {
            EnviarMensaje(data.codigo, data.mensaje);
        }
    } catch (error) {
        EnviarMensaje(-1, "Error al Agregar Carrito: " + error);
    } finally {
        // Pase lo que pase (éxito, error o return temprano), restauramos el botón
        if (boton) {
            boton.disabled = false;
            boton.innerHTML = textoOriginal;
        }
    }
}

async function ValidarCarrito() {
    const sessionStr = localStorage.getItem('user_session') || '{}';
    const session = JSON.parse(sessionStr);
    const usuarioId = Number(session.id || session.UsuarioId || session.UsuarioID || session.usuarioId || 0);
    const token = localStorage.getItem('token');

    if (usuarioId === 0 || !token) return false;

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/Pedidos/carrito/${usuarioId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) return false;

        const data = await response.json();
        const items = data.items || data.Items || [];

        return items.length > 0;
    } catch (error) {
        EnviarMensaje(-1, "Error al validar el carrito: " + error);
        return false;
    }
}

async function procederPago() {
    const tieneProductos = await ValidarCarrito();

    if (!tieneProductos) {
        //EnviarMensaje(0, "No existen productos en el carrito.");

        const modalElement = document.getElementById('modalCarrito');
        if (modalElement) {
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) modalInstance.hide();
        }
        return;
    }

    window.location.href = "checkout.html";
}

function obtenerTotal() {
    return carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
}
async function actualizarVistaCarrito() {
    const badgeCarrito = document.getElementById('contador-carrito');
    if (!badgeCarrito) return;

    try {
        const sessionStr = localStorage.getItem('user_session') || '{}';
        const session = JSON.parse(sessionStr);
        const usuarioId = Number(session.id || session.UsuarioId || session.UsuarioID || session.usuarioId || 0);
        const token = localStorage.getItem('token');

        if (usuarioId === 0) {
            badgeCarrito.style.display = 'none';
            return;
        }

        const response = await fetch(`${CONFIG.API_BASE_URL}/Pedidos/carrito/${usuarioId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            const items = data.items || data.Items || [];

            const totalArticulos = items.reduce((total, item) => total + (item.cantidad || 1), 0);

            badgeCarrito.innerText = totalArticulos;

            if (totalArticulos === 0) {
                badgeCarrito.style.display = 'none';

                const modalElement = document.getElementById('modalCarrito');
                if (modalElement) {
                    const modalInstance = bootstrap.Modal.getInstance(modalElement);
                    if (modalInstance) {
                        modalInstance.hide();
                    }
                }
                // -----------------------------------------------------
            } else {
                badgeCarrito.style.display = 'inline-block';
            }
        } else {
            badgeCarrito.style.display = 'none';
        }
    } catch (error) {
        EnviarMensaje(0, "Error al actualizar el globo del carrito:" + error);
        badgeCarrito.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', actualizarVistaCarrito);

async function abrirCarrito() {
    const contadorBadge = document.getElementById('contador-carrito');
    const cantidadItems = contadorBadge ? parseInt(contadorBadge.innerText) || 0 : 0;

    if (cantidadItems <= 0) {
        toastr.info("Tu carrito está vacío. ¡Agrega algunos productos para continuar!");
        return;
    }

    const modalElement = document.getElementById('modalCarrito');
    const modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
    modalInstance.show();

    await refrescarTablaCarrito();
}

async function refrescarTablaCarrito() {
    const tbody = document.getElementById('lista-carrito-body');
    const spanTotal = document.getElementById('total-carrito');

    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando tu carrito...</td></tr>';

    try {
        const sessionStr = localStorage.getItem('user_session') || '{}';
        const session = JSON.parse(sessionStr);
        const usuarioId = Number(session.id || 0);
        const token = localStorage.getItem('token');

        if (usuarioId === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-warning">Inicia sesión para ver tu carrito.</td></tr>';
            spanTotal.innerText = '0';
            return;
        }

        const response = await fetch(`${CONFIG.API_BASE_URL}/Pedidos/carrito/${usuarioId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("No se pudo cargar el carrito");

        const data = await response.json();
        const items = data.items || [];

        tbody.innerHTML = '';
        let totalCalculado = 0;

        if (items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Tu carrito está vacío.</td></tr>';
            spanTotal.innerText = '0';
            actualizarVistaCarrito();
            return;
        }

        items.forEach(item => {
            const precio = item.precioUnitario || 0;
            const subtotal = precio * item.cantidad;
            totalCalculado += subtotal;

            const idItem = item.id || item.Id || item.carritoID || item.CarritoID || item.detalleID;

            tbody.innerHTML += `
                <tr>
                    <td class="align-middle">${item.productoNombre || item.nombreProducto || 'Producto'}</td>
                    <td class="align-middle">$${precio.toLocaleString()}</td>
                    <td class="align-middle">
                        <div class="input-group input-group-sm mx-auto" style="width: 100px;">
                            <button class="btn btn-outline-secondary fw-bold" onclick="cambiarCantidad(${idItem}, ${item.cantidad - 1})">-</button>
                            <input type="text" class="form-control text-center bg-white" value="${item.cantidad}" readonly>
                            <button class="btn btn-outline-secondary fw-bold" onclick="cambiarCantidad(${idItem}, ${item.cantidad + 1})">+</button>
                        </div>
                    </td>
                    <td class="align-middle fw-bold">$${subtotal.toLocaleString()}</td>
                    <td class="align-middle">
                        <button class="btn btn-outline-danger btn-sm" onclick="eliminarItem(${idItem})">
                            <i class="fa fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        spanTotal.innerText = totalCalculado.toLocaleString();
        actualizarVistaCarrito();

    } catch (error) {
        EnviarMensaje(-1, "Error al visualizar Carrito: " + error);
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">${error.message}</td></tr>`;
    }
}

async function cambiarCantidad(detalleId, nuevaCantidad) {
    if (nuevaCantidad < 1) {
        eliminarItem(detalleId);
        return;
    }
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${CONFIG.API_BASE_URL}/Pedidos/actualizar-cantidad`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ DetalleID: detalleId, Cantidad: nuevaCantidad })
        });
        const data = await response.json();
        //EnviarMensaje(data.codigo, data.mensaje);
        await refrescarTablaCarrito();
    } catch (e) {
        EnviarMensaje(data.codigo, "Error al actualizar cantidad");
    }
}

async function eliminarItem(detalleId) {
    const btnPago = document.getElementById('btn-proceder-pago');
    if (btnPago) {
        btnPago.disabled = true;
        btnPago.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
    }
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/Pedidos/eliminar/${detalleId}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        //EnviarMensaje(data.codigo, data.mensaje);
        await refrescarTablaCarrito();
    } catch (e) {
        EnviarMensaje(data.codigo, data.mensaje);
    } finally {
        if (btnPago) {
            btnPago.disabled = false;
            btnPago.innerText = 'Proceder al Pago';
        }
    }
}