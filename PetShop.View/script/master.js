function ProcesarRespuesta(data) {
    if (data.salidas && Array.isArray(data.salidas) && data.salidas.length > 0) {
        data.salidas.forEach(item => EnviarMensaje(item.codigo, item.mensaje));
    } 
    else if (data.mensaje) {
        EnviarMensaje(data.codigo || 0, data.mensaje);
    }
    else {
        EnviarMensaje(-1,"La respuesta no contiene mensajes:");
    }
}
function EnviarMensaje(codigo, mensaje) {
    toastr.options = { "closeButton": true, "progressBar": true, "positionClass": 'toast-bottom-right' };
    if (codigo <= -1) toastr.error(mensaje);
    else if (codigo === 0) toastr.info(mensaje);
    else toastr.success(mensaje);
}
function Confirmar(mensaje, target = 'body') {
    return Swal.fire({
        icon: 'question',
        title: 'Pregunta',
        text: mensaje,
        showConfirmButton: true,
        confirmButtonText: 'Si, Estoy Seguro',
        showDenyButton: true,
        denyButtonText: 'No, Ya me Arrepentí',
        allowOutsideClick: false,
        target: "#" + target,
    }).then(response => {
        return response.value;
    });
}
function ConfirmarTabla(mensaje, datos, target = 'body') {
    var html = '<div><table class="table text-start"> <tbody>';
    datos.forEach((value, key) => {
        html += '<tr> <th scope="row" class="text-nowrap">' + key + '</th> <td>' + value + '</td> </tr>';
    });
    html += '</tbody> </table></div>'
    return Swal.fire({
        icon: 'question',
        title: mensaje,
        html: html,
        showConfirmButton: true,
        confirmButtonText: 'Si, Estoy Seguro',
        showDenyButton: true,
        denyButtonText: 'No, Ya me Arrepentí',
        allowOutsideClick: false,
        target: "#" + target,
    }).then(response => {
        return response.value;
    });
}
async function realizarLogin(email, password) {
    const btnIniciar = document.querySelector("#formLogin button[type='submit']");
    btnIniciar.disabled = true;
    btnIniciar.innerText = "Iniciando Sesion...";
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/usuarios/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: password })
        });
        
        const data = await response.json();

        if (data.codigo === 1) {
            localStorage.setItem('token', data.token);
            const userSession = {
                nombre: data.user,
                rol: data.rol
            };
            localStorage.setItem('user_session', JSON.stringify(userSession));
            if (data.rol === 'admin') {
                window.location.href = "admin-productos.html";
                btnIniciar.innerText = "ACCESO ADMINISTRADOR";
            } else {
                window.location.href = "main.html";
            }
        } else {
            ProcesarRespuesta(data);
        }
    } catch (error) {
        EnviarMensaje(-1, "Error de conexión con el servidor" + error);
    }
    finally
    {
        btnIniciar.disabled = false;
        btnIniciar.innerText = "ENTRAR";
    }
}
//async function cargarLayout() {
//    // Es vital retornar los resultados de los fetch
//    const p1 = fetch('components/navbar.html').then(r => r.text()).then(html => {
//        document.body.insertAdjacentHTML('afterbegin', html);
//    });

//    const p2 = fetch('components/sidebar.html').then(r => r.text()).then(html => {
//        document.getElementById('sidebar-container').innerHTML = html;
//    });
//    console.warn('HTML' + p2);
//    // Esta línea es la clave: la función espera a que ambos archivos terminen de cargar
//    return Promise.all([p1, p2]);
//}
//async function cargarLayout() {
//    const navRes = await fetch('components/navbar.html');
//    const navHtml = await navRes.text();
//    document.body.insertAdjacentHTML('afterbegin', `<header class="w-100">${navHtml}</header>`);

//    const sideRes = await fetch('components/sidebar.html');
//    const sideHtml = await sideRes.text();

//    const mainContent = document.getElementById('main-content').innerHTML;
//    document.getElementById('main-content').innerHTML = `
//        <div class="row">
//            ${sideHtml}
//            <main class="col-md-10 p-4">${mainContent}</main>
//        </div>
//    `;
//    return Promise.all();
//}