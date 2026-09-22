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
            alert("Debes iniciar sesión para agregar productos a tu carrito.");
            // Opcional: Redirigir al login
            // window.location.href = "login.html";
            return;
        }

        // 2. Preparar los datos a enviar
        const payload = {
            UsuarioID: usuarioId,
            ProductoID: productoId,
            Cantidad: 1 // Por defecto sumamos 1, si tienes input de cantidad, lee su valor aquí
        };

        // 3. Enviar a la API
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
            // ¡ÉXITO! La BD guardó el producto
            // Puedes mostrar un Toast o un Alert
            EnviarMensaje(data.codigo, data.mensaje);
            // alert("¡Producto agregado a tu carrito con éxito!");

            // AHORA SÍ actualizamos el globo rojo visualmente
            actualizarGloboCarrito(usuarioId, token);
        } else {
            EnviarMensaje(data.codigo, data.mensaje);
            //alert("No se pudo agregar: " + (data.mensaje || "Error desconocido"));
        }
    } catch (error) {
        console.error("Error en agregarAlCarrito:", error);
        EnviarMensaje(data.codigo, data.mensaje);
        //alert("Ocurrió un error al comunicarse con el servidor.");
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
    // 1. Mostrar el modal de Bootstrap
    const modalElement = document.getElementById('modalCarrito');
    const modalInstance = new bootstrap.Modal(modalElement);
    modalInstance.show();

    const tbody = document.getElementById('lista-carrito-body');
    const spanTotal = document.getElementById('total-carrito');

    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando tu carrito...</td></tr>';

    try {
        const sessionStr = localStorage.getItem('user_session') || '{}';
        const session = JSON.parse(sessionStr);
        let usuarioId = Number(session.id || session.UsuarioId || session.UsuarioID || session.usuarioId || 0);

        const token = localStorage.getItem('token') || sessionStr;

        // ¡AQUÍ ESTÁ LA CLAVE! 
        // Si no hay email en el storage, lo sacamos a la fuerza del texto de la pantalla (donde está tu nombre)
        let email = session.email || "";
        if (!email) {
            const emailElement = document.getElementById('user-email');
            if (emailElement && emailElement.innerText.trim() !== "") {
                email = emailElement.innerText.trim();
            }
        }

        // 2. Rescate del ID si es 0
        if (usuarioId === 0 && email !== "") {
            try {
                // NOTA: Para que esto pase el ValidarSesionAttribute, debes agregar [AllowAnonymous] 
                // a tu UsuariosController en el método de Get por email
                const resUser = await fetch(`${CONFIG.API_BASE_URL}/Usuarios/por-email?email=${encodeURIComponent(email)}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (resUser.ok) {
                    const userData = await resUser.json();
                    usuarioId = Number(userData.usuarioId || userData.id || 0);

                    if (usuarioId > 0) {
                        session.id = usuarioId;
                        localStorage.setItem('user_session', JSON.stringify(session));
                    }
                }
            } catch (error) {
                console.error("Fallo al rescatar ID:", error);
            }
        }

        if (usuarioId === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-warning">No se pudo identificar tu cuenta. Por favor, vuelve a iniciar sesión.</td></tr>';
            spanTotal.innerText = '0';
            return;
        }

        // 3. Buscar el carrito
        const response = await fetch(`${CONFIG.API_BASE_URL}/Pedidos/carrito/${usuarioId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            if (response.status === 401) throw new Error("Sesión expirada o token inválido");
            throw new Error("No se pudo cargar el carrito");
        }

        const data = await response.json();
        const items = data.items || data.Items || [];

        tbody.innerHTML = '';
        let totalCalculado = 0;

        if (items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Tu carrito está vacío.</td></tr>';
            spanTotal.innerText = '0';
            return;
        }

        // 4. Dibujar
        items.forEach(item => {
            const precio = item.precioUnitario || item.precio || 0;
            const subtotal = precio * item.cantidad;
            totalCalculado += subtotal;

            tbody.innerHTML += `
                <tr>
                    <td>${item.nombreProducto || 'Producto'}</td>
                    <td>$${precio.toLocaleString()}</td>
                    <td>${item.cantidad}</td>
                    <td>$${subtotal.toLocaleString()}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger" onclick="eliminarItem(${item.detalleID || item.productoId})">
                            <i class="fa fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        spanTotal.innerText = totalCalculado.toLocaleString();

    } catch (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">${error.message}</td></tr>`;
    }
}