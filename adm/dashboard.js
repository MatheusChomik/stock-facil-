// Stock Fácil — Dashboard do administrador
(async () => {
  const perfil = await requireAuth('admin');
  if (!perfil) return;

  // Busca produtos e vendas em paralelo.
  const [{ data: produtos, error: errP }, { data: vendas, error: errV }] = await Promise.all([
    sb.from('produtos').select('id, nome, quantidade, estoque_minimo'),
    sb.from('vendas').select('quantidade, total, created_at, produtos(nome)'),
  ]);

  if (errP) console.error('produtos:', errP.message);
  if (errV) console.error('vendas:', errV.message);

  const listaProdutos = produtos || [];
  const listaVendas   = vendas   || [];

  // ---- Cards ----
  const faturamentoTotal = listaVendas.reduce((s, v) => s + Number(v.total || 0), 0);

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const vendasMes = listaVendas.filter(v => new Date(v.created_at) >= inicioMes).length;

  const criticos = listaProdutos.filter(p => Number(p.quantidade) <= Number(p.estoque_minimo));

  document.getElementById('statFaturamento').textContent = moedaBR(faturamentoTotal);
  document.getElementById('statVendasMes').textContent   = vendasMes;
  document.getElementById('statProdutos').textContent    = listaProdutos.length;
  document.getElementById('statCritico').textContent     = String(criticos.length).padStart(2, '0');

  // ---- Notificações de alerta (estoque crítico) ----
  const boxNotif = document.getElementById('listaNotificacoes');
  if (criticos.length === 0) {
    boxNotif.innerHTML = '<p class="vazio">Nenhum produto em nível crítico. 👍</p>';
  } else {
    boxNotif.innerHTML = criticos.map(p => `
      <div class="notificacao">
        <p>${escapeHtml(p.nome)}</p>
        <span>Apenas ${p.quantidade} un. restantes</span>
      </div>`).join('');
  }

  // ---- Top 5 produtos mais vendidos ----
  const agg = {};
  for (const v of listaVendas) {
    const nome = v.produtos ? v.produtos.nome : '(produto removido)';
    if (!agg[nome]) agg[nome] = { qtd: 0, total: 0 };
    agg[nome].qtd   += Number(v.quantidade || 0);
    agg[nome].total += Number(v.total || 0);
  }
  const top = Object.entries(agg).sort((a, b) => b[1].qtd - a[1].qtd).slice(0, 5);

  const tbody = document.getElementById('topVendidos');
  if (top.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="vazio">Nenhuma venda registrada ainda.</td></tr>';
  } else {
    tbody.innerHTML = top.map(([nome, d]) => `
      <tr>
        <td>${escapeHtml(nome)}</td>
        <td>${d.qtd}</td>
        <td>${moedaBR(d.total)}</td>
      </tr>`).join('');
  }
})();

// Evita quebra de layout / injeção quando o nome do produto tem caracteres especiais.
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
