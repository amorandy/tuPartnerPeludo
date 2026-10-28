// Variable global para nuestro carrito
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

// Función para añadir productos
async function agregarAlCarrito(productoId) {
    try {
        // 1. Obtener la sesión actual
        const sessionStr = localStorage.getItem('user_session') || '{}';
        const session = JSON.parse(sessionStr);
        const usuarioId = Number(session.id || session.UsuarioId || session.UsuarioID || session.usuarioId || 0);
        const token = localStorage.getItem('token') || sessionStr;

        if (usuarioId === 0) {
            EnviarMensaje(-1, "Debes iniciar sesión para agregar productos a tu carrito.");
            //alert("Debes iniciar sesión para agregar productos a tu carrito.");
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
            EnviarMensaje(data.codigo, data.mensaje);

            await refrescarTablaCarrito();
            actualizarGloboCarrito(usuarioId, token);
        } else {
            EnviarMensaje(data.codigo, data.mensaje);
        }
    } catch (error) {
        console.error("Error en agregarAlCarrito:", error);
        EnviarMensaje(data.codigo, data.mensaje);
    }
}

function eliminarDelCarrito(productoId) {
    carrito = carrito.filter(item => item.id !== productoId);
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarVistaCarrito();
}

//async function cambiarCantidad(detalleId, variacion) {
//    // Aquí harás el fetch a tu API para actualizar la cantidad (ej: PUT /Pedidos/carrito/actualizar)
//    // Si la API responde OK, llamas de nuevo a la función que renderiza el carrito.
//    console.log(`Cambiando cantidad del detalle ${detalleId} en ${variacion}`);
//}

async function eliminarItem(detalleId) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/Pedidos/eliminar/${detalleId}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.codigo === 1) {
            // Recargar carrito
            cargarCarrito();
        } else {
            EnviarMensaje(0, data.mensaje);
        }
    } catch (e) {
        EnviarMensaje(-1, "Error al eliminar");
    }
}

function procederPago() {
    window.location.href = "checkout.html";
}

// Función para calcular el total (¡Aquí usamos el .reduce que vimos!)
function obtenerTotal() {
    return carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
}
async function actualizarVistaCarrito() {
    const badgeCarrito = document.getElementById('contador-carrito');
    if (!badgeCarrito) return;

    try {
        // 1. Obtener datos de la sesión actual
        const sessionStr = localStorage.getItem('user_session') || '{}';
        const session = JSON.parse(sessionStr);
        const usuarioId = Number(session.id || session.UsuarioId || session.UsuarioID || session.usuarioId || 0);
        const token = localStorage.getItem('token');

        if (usuarioId === 0) {
            badgeCarrito.style.display = 'none';
            return;
        }

        // 2. Consultar el carrito en la base de datos
        const response = await fetch(`${CONFIG.API_BASE_URL}/Pedidos/carrito/${usuarioId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            const items = data.items || data.Items || [];

            // 3. Sumar las cantidades de los productos traídos de la BD
            const totalArticulos = items.reduce((total, item) => total + (item.cantidad || 1), 0);

            // 4. Actualizar el globo rojo
            badgeCarrito.innerText = totalArticulos;

            if (totalArticulos === 0) {
                badgeCarrito.style.display = 'none';
            } else {
                badgeCarrito.style.display = 'inline-block';
            }
        } else {
            badgeCarrito.style.display = 'none';
        }
    } catch (error) {
        console.error("Error al actualizar el globo del carrito:", error);
        badgeCarrito.style.display = 'none';
    }
}

// Ejecutar la función apenas cargue la página
document.addEventListener('DOMContentLoaded', actualizarVistaCarrito);

async function abrirCarrito() {
    // 1. Verificamos el valor actual del contador en el HTML (el badge rojo)
    const contadorBadge = document.getElementById('contador-carrito');
    const cantidadItems = contadorBadge ? parseInt(contadorBadge.innerText) || 0 : 0;

    // 2. Si no hay productos, evitamos que se abra el modal y avisamos al usuario
    if (cantidadItems <= 0) {
        toastr.info("Tu carrito está vacío. ¡Agrega algunos productos para continuar!");
        return; // Detiene la ejecución para que el modal no se levante
    }

    // 3. Si sí hay productos, procedemos a abrir el modal normalmente
    const modalElement = document.getElementById('modalCarrito');
    const modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
    modalInstance.show();

    await refrescarTablaCarrito();
}

async function refrescarTablaCarrito() {
    const tbody = document.getElementById('lista-carrito-body'); // Asegúrate de usar este ID en tu HTML
    const spanTotal = document.getElementById('total-carrito'); // Asegúrate de usar este ID en tu HTML

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
            actualizarVistaCarrito(); // Actualiza el globo rojo a 0
            return;
        }

        items.forEach(item => {
            const precio = item.precioUnitario || 0;
            const subtotal = precio * item.cantidad;
            totalCalculado += subtotal;

            tbody.innerHTML += `
                <tr>
                    <td class="align-middle">${item.productoNombre || item.nombreProducto || 'Producto'}</td>
                    <td class="align-middle">$${precio.toLocaleString()}</td>
                    <td class="align-middle">
                        <div class="input-group input-group-sm mx-auto" style="width: 100px;">
                            <button class="btn btn-outline-secondary fw-bold" onclick="cambiarCantidad(${item.detalleID}, ${item.cantidad - 1})">-</button>
                            <input type="text" class="form-control text-center bg-white" value="${item.cantidad}" readonly>
                            <button class="btn btn-outline-secondary fw-bold" onclick="cambiarCantidad(${item.detalleID}, ${item.cantidad + 1})">+</button>
                        </div>
                    </td>
                    <td class="align-middle fw-bold">$${subtotal.toLocaleString()}</td>
                    <td class="align-middle">
                        <button class="btn btn-outline-danger btn-sm" onclick="eliminarItem(${item.detalleID})">
                            <i class="fa fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        spanTotal.innerText = totalCalculado.toLocaleString();
        actualizarVistaCarrito(); // Actualiza el globo rojo con las nuevas cantidades

    } catch (error) {
        console.error(error);
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
        if (data.codigo === 1) {
            await refrescarTablaCarrito();
        } else {
            EnviarMensaje(0, data.mensaje);
        }
    } catch (e) {
        EnviarMensaje(-1, "Error al actualizar cantidad");
    }
}

async function eliminarItem(detalleId) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/Pedidos/eliminar/${detalleId}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        if (data.codigo === 1) {
            await refrescarTablaCarrito();
        } else {
            EnviarMensaje(0, data.mensaje);
        }
    } catch (e) {
        EnviarMensaje(-1, "Error al eliminar");
    }
}