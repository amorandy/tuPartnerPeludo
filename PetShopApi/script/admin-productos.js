document.getElementById('form-producto').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("Nombre", document.getElementById('nombre').value);
    formData.append("Descripcion", document.getElementById('descripcion').value);
    formData.append("Precio", document.getElementById('precio').value);
    formData.append("Stock", document.getElementById('stock').value);
    const fileInput = document.getElementById('imagenProducto');
    formData.append("file", fileInput.files[0]); 
    const response = await fetch(`${CONFIG.API_BASE_URL}/Productos`, {
        method: 'POST',
        body: formData 
    });
    const data = await response.json();
    if(data.codigo === 1) {
        document.getElementById('form-producto').reset();
        renderizarTablaProductos(); 
    }
    ProcesarRespuesta(data);
});

window.onload = function() {
    initAuth((data) => {
        const nombre = data.nombre || data.name;
        const foto = data.foto || data.picture;
        const nombreElement = document.getElementById('user-name');
        if (nombreElement) {
            nombreElement.innerText = nombre.toUpperCase();
        }
        const imgElement = document.getElementById('user-img');
        if (imgElement) {
            imgElement.src = foto || "images/default-user.png";
        }
    });
}

function verificarAdmin() {
    const session = JSON.parse(localStorage.getItem('user_session'));
    if (!session || session.rol !== 'admin') {
        EnviarMensaje(-1, "Acceso denegado: Área exclusiva para administradores");
        window.location.href = "main.html";
    }
}
verificarAdmin();

async function cargarProductos() {
    const response = await fetch(`${CONFIG.API_BASE_URL}/Productos/listar`);
    const data = await response.json();
    if (data.codigo === 1) {
        const contenedor = document.getElementById('contenedorProductos');
        contenedor.innerHTML = '';
        data.productos.forEach(p => {
            const urlCompleta = `https://tupartnerpeludo.onrender.com${p.urlImagen}`;
            contenedor.innerHTML += `
                <div class="col-md-4">
                    <div class="card">
                        <img src="${urlCompleta}" class="card-img-top" alt="${p.nombre}" style="height: 200px; object-fit: cover;">
                        <div class="card-body">
                            <h5>${p.nombre}</h5>
                            <p>Precio: $${p.precio}</p>
                        </div>
                    </div>
                </div>
            `;
        });
    }
}

async function renderizarTablaProductos() {
    const contenedor = document.getElementById('lista-productos');
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/Productos`);
        const data = await response.json();
        if (data.productos && Array.isArray(data.productos)) {
            contenedor.innerHTML = ''; 
            data.productos.forEach(p => {
                contenedor.innerHTML += `
                    <tr>
                        <td><img src="${p.urlImagen}" class="img-thumbnail" style="width: 50px;"></td>
                        <td>${p.nombre}</td>
                        <td>$${p.precio.toLocaleString()}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary me-2" onclick='prepararEdicion(${JSON.stringify(p)})'>
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="eliminarProducto(${p.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        } else {
            console.warn("La API no devolvió una lista en 'productos'", data);
        }
    } catch (error) {
        console.error("Error al cargar la tabla mensaje:", error);
    }
}

document.getElementById('form-producto').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('productoId').value;
    const formData = new FormData(e.target);
    const url = id 
        ? `${CONFIG.API_BASE_URL}/Productos/actualizar/${id}` 
        : `${CONFIG.API_BASE_URL}/Productos/guardar`; // Aquí usamos la ruta que ya tienes funcionando
    const method = id ? 'PUT' : 'POST';
    const response = await fetch(url, { 
        method: method, 
        body: formData 
    });
    const data = await response.json();
    if(data.codigo === 1) {
        toastr.success(id ? "Producto actualizado" : "Producto guardado");
        document.getElementById('form-producto').reset();
        document.getElementById('productoId').value = ''; // Limpiamos el ID
        renderizarTablaProductos();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    renderizarTablaProductos();
});