// Stock Fácil — Registro de Vendas
(async () => {
  const perfil = await requireAuth('admin');
  if (!perfil) return;

  const { data } = await sb.from('vendas')
    .select('quantidade, total, created_at, produtos(nome)')
    .order('created_at', { ascending: false });

  const lista = data || [];
  const busca = document.getElementById('busca');

  function render(items) {
    const tbody = document.getElementById('tabela');
    const totalGeral = items.reduce((s, v) => s + Number(v.total), 0);

    tbody.innerHTML = items.length
      ? items.map(v => `
          <tr>
            <td>${esc(v.produtos?.nome ?? '—')}</td>
            <td>${v.quantidade}</td>
            <td>${moedaBR(v.total)}</td>
            <td>${new Date(v.created_at).toLocaleDateString('pt-BR')}</td>
          </tr>`).join('')
      : '<tr><td colspan="4" class="vazio">Nenhuma venda registrada.</td></tr>';

    document.getElementById('total').textContent = moedaBR(totalGeral);
  }

  busca.addEventListener('input', () => {
    const t = busca.value.toLowerCase();
    render(lista.filter(v => (v.produtos?.nome ?? '').toLowerCase().includes(t)));
  });

  render(lista);
})();

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
