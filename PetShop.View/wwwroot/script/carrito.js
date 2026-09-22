// Variable global para nuestro carrito
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

async function agregarAlCarrito(producto) {
    const token = localStorage.getItem('token') || localStorage.getItem('user_session');
    const session = JSON.parse(localStorage.getItem('user_session') || '{}');

    // Estructura exacta que espera tu PedidoDto / Pedido en C#
    const datosPedido = {
        usuarioId: session.id || 0, // Asegúrate de tener el ID del usuario en la sesión
        clienteEmail: session.email || "invitado@mail.com",
        total: producto.precio,
        items: [
            {
                productoId: producto.id,
                cantidad: 1,
                precioUnitario: producto.precio
            }
        ]
    };

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/Pedidos/agregar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(datosPedido)
        });

        const resultado = await response.json();

        if (response.ok) {
            alert("¡Producto agregado al carrito con éxito!");
            actualizarVistaCarrito();
        } else {
            alert("Error: " + (resultado.mensaje || "No se pudo agregar"));
        }
    } catch (error) {
        console.error("Error de red:", error);
    }
}

// Función para eliminar un producto
function eliminarDelCarrito(productoId) {
    carrito = carrito.filter(item => item.id !== productoId);
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarVistaCarrito();
}

// Función para calcular el total (¡Aquí usamos el .reduce que vimos!)
function obtenerTotal() {
    return carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
}
// Función para actualizar toda la vista del carrito (Contador y Lista)
function actualizarVistaCarrito() {
    // 1. Actualizar el contador numérico en el ícono del carrito del Navbar
    const contadorCarrito = document.getElementById('contador-carrito');
    if (contadorCarrito) {
        // Sumamos la cantidad total de artículos (no solo tipos de productos)
        const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);
        contadorCarrito.innerText = totalItems;
    }

    // 2. Renderizar los productos si existe el contenedor del carrito en la página actual
    const contenedorCarritoItems = document.getElementById('contenedor-carrito-items');
    const labelTotal = document.getElementById('carrito-total');

    if (contenedorCarritoItems) {
        // Si el carrito está vacío
        if (carrito.length === 0) {
            contenedorCarritoItems.innerHTML = `
                <div class="text-center p-4 text-muted">
                    <i class="fas fa-shopping-cart fa-2x mb-2"></i>
                    <p>Tu carrito está vacío</p>
                </div>`;
        } else {
            // Si tiene productos, los dibujamos uno a uno
            contenedorCarritoItems.innerHTML = carrito.map(item => `
                <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                    <div class="d-flex align-items-center">
                        <img src="${item.imagen || 'images/default-product.png'}" width="50" height="50" class="rounded me-3" style="object-fit:cover;">
                        <div>
                            <h6 class="mb-0 fw-bold">${item.nombre}</h6>
                            <small class="text-muted">$${item.precio} x ${item.cantidad}</small>
                        </div>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <span class="fw-bold">$${(item.precio * item.cantidad).toLocaleString()}</span>
                        <button onclick="eliminarDelCarrito(${item.id})" class="btn btn-sm btn-outline-danger">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }

    // 3. Actualizar el precio total usando tu función obtenerTotal()
    if (labelTotal) {
        labelTotal.innerText = `$${obtenerTotal().toLocaleString()}`;
    }
}

// Ejecutar automáticamente al cargar la página para que el contador no se pierda al recargar
document.addEventListener('DOMContentLoaded', () => {
    actualizarVistaCarrito();
});