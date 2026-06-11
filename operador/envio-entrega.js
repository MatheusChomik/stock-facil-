// Stock Fácil — Envio e Entrega
(async () => {
  const perfil = await requireAuth('operador');
  if (!perfil) return;

  async function carregar() {
    const { data } = await sb.from('pedidos')
      .select('id, cliente, endereco, transportadora, status, codigo_rastreamento, created_at')
      .order('created_at', { ascending: false });

    const lista  = (data || []).filter(p => ['Aprovado', 'Em Rota'].includes(p.status));
    const tbody  = document.getElementById('tbodyEnvio');
    const badgeC = { 'Aprovado': 'badge-enviado', 'Em Rota': 'badge-separacao' };

    tbody.innerHTML = lista.length
      ? lista.map(p => `
          <tr>
            <td>${esc(p.cliente)}</td>
            <td>${esc(p.endereco || '—')}</td>
            <td>${esc(p.transportadora || '—')}</td>
            <td>${esc(p.codigo_rastreamento || '—')}</td>
            <td><span class="badge ${badgeC[p.status]}">${p.status}</span></td>
            <td>
              <button class="btn btn-primary btn-sm" onclick="confirmar('${p.id}')">Confirmar Entrega</button>
            </td>
          </tr>`).join('')
      : '<tr><td colspan="6" class="vazio">Nenhum pedido em trânsito.</td></tr>';
  }

  window.confirmar = async function(id) {
    if (!confirm('Confirmar entrega deste pedido?')) return;
    await sb.from('pedidos').update({ status: 'Entregue' }).eq('id', id);
    carregar();
  };

  carregar();
})();

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
