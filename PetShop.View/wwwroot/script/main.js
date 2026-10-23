window.onload = function () {
    const sessionStr = localStorage.getItem('user_session');
    if (sessionStr) {
        const session = JSON.parse(sessionStr);

        const nombre = session.nombre || session.user || session.name || "Usuario";
        const email = session.email || "";
        const foto = session.foto || session.picture || "images/default-user.png";

        // Actualizamos el nombre
        const userNameNav = document.getElementById('user-name');
        if (userNameNav) userNameNav.innerText = nombre.toUpperCase();

        // Actualizamos el correo (si existe en tu navbar)
        const emailElement = document.getElementById('user-email');
        if (emailElement) emailElement.innerText = email;

        // AQUÍ ESTÁ LA CLAVE PARA LA FOTO EN LA BARRA DE NAVEGACIÓN
        const imgNav = document.getElementById('icono-usuario');
        if (imgNav) {
            imgNav.src = foto;
            imgNav.style.objectFit = "cover";
            imgNav.style.borderRadius = "50%";
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
