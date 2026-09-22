window.onload = function () {
    const sessionStr = localStorage.getItem('user_session');
    if (sessionStr) {
        const session = JSON.parse(sessionStr);

        const nombre = session.nombre || session.user || session.name || "Usuario";
        const email = session.email || "";
        const foto = session.foto || session.picture || "images/default-user.png";

        document.getElementById('user-name').innerText = nombre.toUpperCase();
        document.getElementById('user-img').src = foto;

        const emailElement = document.getElementById('user-email');
        if (emailElement) {
            emailElement.innerText = email;
        }

        if (session.rol === 'admin') {
            const btnAdmin = document.getElementById('btn-admin');
            if (btnAdmin) btnAdmin.classList.remove('d-none');
        }
    }
};

async function cargarProductos() {
    try {
        // Usamos la configuración global para mantener la consistencia (local/producción)
        const response = await fetch(`${CONFIG.API_BASE_URL}/Productos`);
        const data = await response.json();

        const contenedor = document.getElementById('contenedor-productos');
        contenedor.innerHTML = "";

        data.productos.forEach(prod => {
            const card = document.createElement('div');
            card.className = 'col-md-4 mb-4';

            // CORRECCIÓN CRÍTICA: En el onclick ahora pasamos 'prod.id' (solo el número)
            card.innerHTML = `
                <div class="card p-3 border-2 border-dark shadow-sm">
                    <img src="${prod.urlImagen}" class="card-img-top" alt="${prod.nombre}">
                    <div class="card-body">
                        <h5>${prod.nombre}</h5>
                        <p class="small text-muted">${prod.descripcion}</p>
                        <p class="fw-bold">$${prod.precio.toLocaleString()}</p>
                        <button class="btn btn-dark w-100" onclick='agregarAlCarrito(${prod.id})'>
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
