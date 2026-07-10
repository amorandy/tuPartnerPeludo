window.onload = function() {
    const session = JSON.parse(localStorage.getItem('user_session'));
    const nombre = session.nombre || session.name;
    const foto = session.foto || session.picture;
    document.getElementById('user-name').innerText = nombre.toUpperCase();
    document.getElementById('user-img').src = foto || "images/default-user.png";
    if (session && session.rol === 'admin') {
        document.getElementById('btn-admin').classList.remove('d-none');
    }
};

async function cargarProductos() {
    try {
        const response = await fetch('https://tupartnerpeludo.onrender.com/api/Productos');
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
                        <button class="btn btn-dark w-100" onclick='agregarAlCarrito(${JSON.stringify(prod)})'>
                            <i class="fas fa-shopping-cart"></i> Añadir
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
