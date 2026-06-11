// Stock Fácil — Painel do Operador
(async () => {
  const perfil = await requireAuth('operador');
  if (!perfil) return;

  const [{ data: pedidos }, { data: itens }] = await Promise.all([
    sb.from('pedidos').select('id, cliente, status, created_at').order('created_at', { ascending: false }),
    sb.from('itens_pedido').select('pedido_id, quantidade'),
  ]);

  const lista = pedidos || [];
  const itensPorPedido = {};
  for (const it of itens || []) {
    itensPorPedido[it.pedido_id] = (itensPorPedido[it.pedido_id] || 0) + 1;
  }

  const cnt = (s) => lista.filter(p => p.status === s).length;
  document.getElementById('cntPendente').textContent  = String(cnt('Pendente')).padStart(2, '0');
  document.getElementById('cntSeparacao').textContent = String(cnt('Em Separação')).padStart(2, '0');
  document.getElementById('cntRota').textContent      = String(cnt('Em Rota')).padStart(2, '0');
  document.getElementById('cntEntregue').textContent  = String(cnt('Entregue')).padStart(2, '0');

  const abertos = lista.filter(p => p.status !== 'Entregue');
  const badgeClass = {
    'Pendente':     'badge-pendente',
    'Em Separação': 'badge-separacao',
    'Aprovado':     'badge-enviado',
    'Em Rota':      'badge-separacao',
    'Entregue':     'badge-entregue',
  };

  document.getElementById('tbodyPedidos').innerHTML = abertos.length
    ? abertos.map((p, i) => `
        <tr>
          <td>#${String(1001 + i).padStart(4, '0')}</td>
          <td>${esc(p.cliente)}</td>
          <td>${itensPorPedido[p.id] || 0} item(s)</td>
          <td><span class="badge ${badgeClass[p.status] || ''}">${p.status}</span></td>
          <td>${new Date(p.created_at).toLocaleDateString('pt-BR')}</td>
          <td><a href="atualizar.html" class="btn btn-secondary btn-sm">Abrir</a></td>
        </tr>`).join('')
    : '<tr><td colspan="6" class="vazio">Nenhum pedido em aberto.</td></tr>';
})();

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
