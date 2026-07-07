document.getElementById('form-producto').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("Nombre", document.getElementById('nombre').value);
    formData.append("Descripcion", document.getElementById('descripcion').value);
    formData.append("Precio", document.getElementById('precio').value);
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
document.getElementById('form-producto').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("Nombre", document.getElementById('nombre').value);
    formData.append("Precio", document.getElementById('precio').value);
    formData.append("Descripcion", document.getElementById('descripcion').value);
    const fileInput = document.getElementById('imagenProducto');
    formData.append("file", fileInput.files[0]);
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/Productos/guardar`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (data.codigo === 1) {
            document.getElementById('form-producto').reset();
        } 
        ProcesarRespuesta(data);
    } catch (error) {
        EnviarMensaje(-1,"Error de conexión con el servidor");
    }
});

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
                            <p>Descripción: ${p.descripcion}</p>
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
                    <tr data-id="${p.id}"> 
                        <td><img src="${p.urlImagen}" class="img-tabla-producto"></td>
                        <td>${p.nombre}</td>
                        <td>${p.descripcion}</td>
                        <td>${p.precio}</td>
                        <td>${p.stock}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary" 
                                    onclick="activarEdicionInline(${p.id}, '${p.nombre}', '${p.descripcion}', ${p.precio}, ${p.stock})">
                                Editar
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="eliminarProducto(${p.id})">Eliminar</button>
                        </td>
                    </tr>
                `;
            });
        }
    } catch (error) {
        console.error("Error al cargar la tabla:", error);
    }
}

document.getElementById('form-producto').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('productoId').value;
    const formData = new FormData(e.target);
    const esEdicion = id && id !== "";
    const url = esEdicion
        ? `${CONFIG.API_BASE_URL}/Productos/actualizar/${id}`
        : `${CONFIG.API_BASE_URL}/Productos/guardar`;
    const metodo = esEdicion ? 'PUT' : 'POST';
    try {
        const response = await fetch(url, {
            method: metodo,
            body: formData
        });
    const data = await response.json();

        if (data.codigo === 1) {
            e.target.reset();
            document.getElementById('productoId').value = "";
            renderizarTablaProductos();
        }
        ProcesarRespuesta(data);
    } catch (error) {
        EnviarMensaje(-1,"Error de conexión");
    }
});

document.addEventListener('DOMContentLoaded', () => {
    renderizarTablaProductos();
});

function prepararEdicion(producto) {
    document.getElementById('productoId').value = producto.id;
    document.getElementById('nombre').value = producto.nombre;
    document.getElementById('precio').value = producto.precio;
    document.getElementById('descripcion').value = producto.descripcion;
    document.getElementById('stock').value = producto.stock;
    const btnSubmit = document.querySelector('#form-producto button[type="submit"]');
    btnSubmit.innerText = "Actualizar Producto";
    document.getElementById('imagenProducto').removeAttribute('required');
}

async function eliminarProducto(producto) {
    if (!producto) {
        console.error("El objeto producto es nulo o indefinido");
        return;
    }
    const datosParaConfirmar = new Map();
    datosParaConfirmar.set("Nombre", producto.nombre || "N/A");
    datosParaConfirmar.set("Descripción", producto.descripcion || "N/A");
    datosParaConfirmar.set("Precio", producto.precio || "N/A");
    datosParaConfirmar.set("Stock", producto.stock || "N/A");
    const aceptado = await ConfirmarTabla("¿Estás seguro de eliminar este producto?", datosParaConfirmar);
    if (aceptado) {
        const formData = new FormData();
        formData.append("id", producto.id);
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/Productos/eliminar`, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (data.codigo === 1) {
                renderizarTablaProductos();
            }
            ProcesarRespuesta(data);
        } catch (error) {
            EnviarMensaje(-1, "Error de conexión");
        }
    }
}
let formularioAbierto = null;
function activarEdicionInline(id, nombre, descripcion, precio, stock) {
    if (formularioAbierto) formularioAbierto.remove();
    const filaProducto = document.querySelector(`tr[data-id="${id}"]`);
    const filaFormulario = document.createElement('tr');
    filaFormulario.innerHTML = `
        <td colspan="5" class="p-3 bg-light">
            <div class="card card-body shadow-sm">
                <h5>Editando: ${nombre}</h5>
                <form id="form-edit-inline" class="row g-3">
                    <input type="hidden" value="${id}" id="edit-id">
                    <div class="col-md-3"><input type="text" id="edit-nombre" class="form-control" value="${nombre}"></div>
                    <div class="col-md-2"><input type="text" id="edit-descripcion" class="form-control" value="${descripcion}"></div>
                    <div class="col-md-2"><input type="number" id="edit-precio" class="form-control" value="${precio}"></div>
                    <div class="col-md-2"><input type="number" id="edit-stock" class="form-control" value="${stock}"></div>
                    <div class="col-md-3"><input type="file" id="edit-imagenProducto" class="form-control"></div>
                    <div class="col-md-5">
                        <button type="button" class="btn btn-success" id="btn-guardar-inline" onclick="guardarEdicion()">
                            <span class="spinner-border spinner-border-sm d-none" id="spinner-guardar" role="status" aria-hidden="true"></span>
                            Guardar
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="cancelarEdicion()">Cancelar</button>
                    </div>
                </form>
            </div>
        </td>
    `;
    filaProducto.after(filaFormulario);
    formularioAbierto = filaFormulario;
}
function cancelarEdicion() {
    if (formularioAbierto) formularioAbierto.remove();
    formularioAbierto = null;
}
async function guardarEdicion() {
    const id = document.getElementById('edit-id').value;
    const nombre = document.getElementById('edit-nombre').value;
    const descripcion = document.getElementById('edit-descripcion').value;
    const precio = document.getElementById('edit-precio').value;
    const stock = document.getElementById('edit-stock').value;
    const fileInput = document.getElementById('edit-imagenProducto');
    const dataParaConfirmar = new Map();
    dataParaConfirmar.set("Nombre", nombre);
    dataParaConfirmar.set("Precio", `$${parseFloat(precio).toLocaleString()}`);
    dataParaConfirmar.set("Stock", stock);
    dataParaConfirmar.set("Descripción", descripcion);
    const aceptado = await ConfirmarTabla("¿Confirmas que deseas aplicar estos cambios?", dataParaConfirmar);
    if (aceptado) {
        const btn = document.getElementById('btn-guardar-inline');
        const spinner = document.getElementById('spinner-guardar');
        btn.disabled = true;
        spinner.classList.remove('d-none');
        const formData = new FormData();
        formData.append("Nombre", nombre);
        formData.append("Precio", precio);
        formData.append("Stock", stock);
        formData.append("Descripcion", descripcion);
        const imagen = fileInput.files[0];
        if (imagen) {
            formData.append("Imagen", imagen);
        }
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/Productos/actualizar/${id}`, {
                method: 'PUT',
                body: formData
            });
            const data = await response.json();
            if (data.codigo === 1) {
                cancelarEdicion();
                renderizarTablaProductos();
            }
            ProcesarRespuesta(data);
        } catch (error) {
            EnviarMensaje(-1, "Error de conexión al servidor");
            console.error(error);
        }
        finally {
            btn.disabled = false;
            spinner.classList.add('d-none');
        }
    }
}