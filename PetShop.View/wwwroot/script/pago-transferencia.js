fetch('components/navbar.html').then(r => r.text()).then(h => document.getElementById('layout-navbar').innerHTML = h);

const urlParams = new URLSearchParams(window.location.search);
const pedidoId = urlParams.get('pedido');

if (pedidoId) {
    document.getElementById('lbl-numero-orden').innerText = `#${pedidoId}`;
    document.getElementById('lbl-numero-orden-alert').innerText = pedidoId;

    const token = localStorage.getItem('token');
    fetch(`${CONFIG.API_BASE_URL}/Pedidos/detalle/${pedidoId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
        .then(res => res.json())
        .then(data => {
            const p = data.data || data.pedido;
            if (p) {
                document.getElementById('lbl-monto-transferir').innerText = `$${p.total.toLocaleString()}`;
            }
        })
        .catch(err => console.error("Error al obtener el total:", err));
} else {
    window.location.href = 'index.html';
}