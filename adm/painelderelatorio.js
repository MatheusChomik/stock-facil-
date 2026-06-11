// Stock Fácil — Painel de Relatório
(async () => {
  const perfil = await requireAuth('admin');
  if (!perfil) return;

  const [{ data: vendas }, { data: produtos }] = await Promise.all([
    sb.from('vendas').select('total, created_at').order('created_at', { ascending: true }),
    sb.from('produtos').select('nome, quantidade, estoque_minimo'),
  ]);

  const listaVendas   = vendas   || [];
  const listaProdutos = produtos || [];

  // Faturamento por mês (últimos 6 meses)
  const meses = {};
  for (const v of listaVendas) {
    const d   = new Date(v.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    meses[key] = (meses[key] || 0) + Number(v.total);
  }
  const labels = Object.keys(meses).sort().slice(-6);
  const vals   = labels.map(k => meses[k]);
  const max    = Math.max(...vals, 1);
  const mPT    = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  document.getElementById('grafico').innerHTML = labels.length
    ? labels.map((key, i) => {
        const m = parseInt(key.split('-')[1]) - 1;
        return `<div class="chart-bar">
          <span class="bar-label">${mPT[m]}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${(vals[i] / max) * 100}%"></div></div>
          <span class="bar-value">${moedaBR(vals[i])}</span>
        </div>`;
      }).join('')
    : '<p class="vazio">Nenhuma venda registrada ainda.</p>';

  // Stats
  const hoje      = new Date().toLocaleDateString('pt-BR');
  const totalHoje = listaVendas
    .filter(v => new Date(v.created_at).toLocaleDateString('pt-BR') === hoje)
    .reduce((s, v) => s + Number(v.total), 0);
  const ticket = listaVendas.length
    ? listaVendas.reduce((s, v) => s + Number(v.total), 0) / listaVendas.length
    : 0;

  document.getElementById('statHoje').textContent   = moedaBR(totalHoje);
  document.getElementById('statTicket').textContent = moedaBR(ticket);

  // Alertas
  const criticos = listaProdutos.filter(p => Number(p.quantidade) <= Number(p.estoque_minimo));
  const box = document.getElementById('alertas');
  box.innerHTML = criticos.length
    ? criticos.map(p => {
        const badge = p.quantidade === 0
          ? '<span class="restam">Sem estoque!</span>'
          : `<span class="restam">Restam ${p.quantidade} un.</span>`;
        return `<div class="alert-item"><span>${esc(p.nome)}</span>${badge}</div>`;
      }).join('')
    : '<div class="alert-item"><span>Todos os produtos estão com estoque OK.</span><span class="ok">✓</span></div>';
})();

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
