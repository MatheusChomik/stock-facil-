// Stock Fácil — Atualizar Pedidos
(async () => {
  const perfil = await requireAuth('operador');
  if (!perfil) return;

  let pedidos = [];
  const busca = document.getElementById('busca');

  async function carregar() {
    const { data } = await sb.from('pedidos')
      .select('id, cliente, status, codigo_rastreamento, endereco')
      .order('created_at', { ascending: false });
    pedidos = (data || []).filter(p => p.status !== 'Entregue');
    render(pedidos);
  }

  const statusOpts = ['Pendente','Em Separação','Aprovado','Em Rota','Entregue'];

  function render(lista) {
    const container = document.getElementById('listaPedidos');
    if (!lista.length) {
      container.innerHTML = '<p class="vazio" style="padding:24px">Nenhum pedido em aberto.</p>';
      return;
    }
    container.innerHTML = lista.map(p => `
      <div class="pedido-card">
        <div class="pedido-header">
          <h3>${esc(p.cliente)}</h3>
          <span class="badge badge-pendente">${p.status}</span>
        </div>
        ${p.endereco ? `<p style="font-size:13px;color:var(--text-muted);padding:8px 20px 0">📍 ${esc(p.endereco)}</p>` : ''}
        <div class="pedido-form">
          <div class="form-box" style="padding:0;border:none;background:transparent;max-width:100%;">
            <label>Alterar Status</label>
            <select id="sel-${p.id}">
              ${statusOpts.map(s => `<option value="${s}"${s === p.status ? ' selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-box" style="padding:0;border:none;background:transparent;max-width:100%;">
            <label>Código de Rastreamento</label>
            <input type="text" id="cod-${p.id}" value="${esc(p.codigo_rastreamento || '')}" placeholder="Ex: BR123456789">
          </div>
          <div>
            <button class="btn btn-primary" onclick="salvar('${p.id}')">Salvar Alterações</button>
          </div>
        </div>
      </div>`).join('');
  }

  window.salvar = async function(id) {
    const status = document.getElementById('sel-' + id).value;
    const cod    = document.getElementById('cod-' + id).value.trim();
    await sb.from('pedidos').update({ status, codigo_rastreamento: cod }).eq('id', id);
    await carregar();
  };

  busca.addEventListener('input', () => {
    const t = busca.value.toLowerCase();
    render(pedidos.filter(p => p.cliente.toLowerCase().includes(t)));
  });

  carregar();
})();

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
