document.addEventListener('DOMContentLoaded', () => {
    cargarMisPedidos();
});

async function cargarMisPedidos() {
    const token = localStorage.getItem('token');
    const userSession = JSON.parse(localStorage.getItem('user_session') || '{}');
    const usuarioId = userSession.id;

    if (!token || !usuarioId) {
        localStorage.removeItem('token');
        localStorage.removeItem('user_session');
        window.location.replace('index.html');
        return;
    }

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/Pedidos/usuario/${usuarioId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const tbody = document.getElementById('tabla-mis-pedidos');
        tbody.innerHTML = '';

        if (!response.ok) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger py-4">Error al cargar los pedidos.</td></tr>';
            return;
        }

        const data = await response.json();

        const misPedidos = data || [];

        if (misPedidos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">Aún no has realizado ningún pedido.</td></tr>';
            return;
        }

        misPedidos.forEach(pedido => {
            const fecha = new Date(pedido.fechaPedido || pedido.FechaPedido).toLocaleDateString('es-CL');
            const totalFmt = new Intl.NumberFormat('es-CL').format(pedido.total || pedido.Total);
            const estado = pedido.estado || pedido.Estado;
            const metodoPago = pedido.metodoPago || pedido.MetodoPago || 'N/A';
            const pedidoId = pedido.pedidoID || pedido.PedidoID;

            let badgeClass = 'bg-secondary';
            if (estado === 'Pendiente') badgeClass = 'bg-warning text-dark';
            if (estado === 'Completado' || estado === 'Pagado') badgeClass = 'bg-success';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="fw-bold">#${pedidoId}</td>
                <td>${fecha}</td>
                <td>${metodoPago}</td>
                <td>$${totalFmt}</td>
                <td><span class="badge ${badgeClass}">${estado}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-dark" onclick="verDetallePedido(${pedidoId}, ${pedido.total || pedido.Total})">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error("Error:", error);
        document.getElementById('tabla-mis-pedidos').innerHTML =
            '<tr><td colspan="6" class="text-center text-danger py-4">Error de conexión con el servidor.</td></tr>';
    }
}

async function verDetallePedido(pedidoId, totalPedido) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/Pedidos/detalle/${pedidoId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            const detalles = data.pedido.detalles || data.pedido.productos || data.pedido.items || [];
            const tbody = document.getElementById('tabla-detalle-items');
            tbody.innerHTML = '';

            detalles.forEach(item => {
                const precioUnit = item.precioUnitario || item.PrecioUnitario;
                const cant = item.cantidad || item.Cantidad;
                const nombre = item.nombreProducto || item.NombreProducto || ('Producto ID: ' + (item.productoID || item.ProductoID));

                const precioFmt = new Intl.NumberFormat('es-CL').format(precioUnit);
                const subtotalFmt = new Intl.NumberFormat('es-CL').format(precioUnit * cant);

                tbody.innerHTML += `
                    <tr>
                        <td>${nombre}</td>
                        <td>$${precioFmt}</td>
                        <td>${cant}</td>
                        <td class="fw-bold">$${subtotalFmt}</td>
                    </tr>
                `;
            });

            document.getElementById('detalle-id').innerText = pedidoId;
            document.getElementById('detalle-total').innerText = new Intl.NumberFormat('es-CL').format(totalPedido);
            const modal = new bootstrap.Modal(document.getElementById('modalDetallePedido'));
            modal.show();
        } else {
            toastr.error("No se pudo cargar el detalle del pedido.");
        }
    } catch (error) {
        console.error("Error al obtener detalle:", error);
    }
}