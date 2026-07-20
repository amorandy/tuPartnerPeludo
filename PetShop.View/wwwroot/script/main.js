window.onload = function() {
    const session = JSON.parse(localStorage.getItem('user_session'));
    const nombre = session.nombre || session.name;
    const foto = session.foto || session.picture;
    const email = session.email;
    document.getElementById('user-name').innerText = nombre.toUpperCase();
    document.getElementById('user-img').src = foto || "images/default-user.png";
    if (session && session.rol === 'admin') {
        document.getElementById('btn-admin').classList.remove('d-none');
    }
    const emailElement = document.getElementById('user-email');
    if (emailElement) emailElement.innerText = email;
};

async function agregarAlCarrito(productoID, precio) {
    const response = await fetch(`${CONFIG.API_BASE_URL}/Pedidos/agregar`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ productoID, cantidad: 1, precio })
    });
    console.log(response);
    const result = await response.json();
    if (result.codigo === 1) toastr.success("Producto agregado!");
}

async function cargarProductos() {
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('user_session');
        console.log(token);
        const response = await fetch(`${CONFIG.API_BASE_URL}/Productos`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            }
        });
        if (!response.ok) {
            throw new Error("No autorizado o error al obtener productos.");
        }
        const data = await response.json();
        const contenedor = document.getElementById('contenedor-productos');
        contenedor.innerHTML = "";
        data.productos.forEach(prod => {
            const card = document.createElement('div');
            card.className = 'col-md-4 mb-4';
            card.innerHTML = `
                <div class="card p-3 border-2 border-dark shadow-sm">
                    <img src="${prod.urlImagen}" class="card-img-top" alt="${prod.nombre}">
                    <div class="card-body">
                        <h5>${prod.nombre}</h5>
                        <p class="small text-muted">${prod.descripcion}</p>
                        <p class="fw-bold">$${prod.precio.toLocaleString()}</p>
                        <!-- En tu bucle de productos -->
                        <button class="btn btn-primary" onclick="agregarAlCarrito(123, 25.50)">
                            <i class="fa fa-cart-plus"></i>
                        </button>
                    </div>
                </div>
            `;
            contenedor.appendChild(card);
        });
    } catch (error) {
        console.error("Error al cargar productos:", error);
    }
}
document.addEventListener('DOMContentLoaded', cargarProductos);
