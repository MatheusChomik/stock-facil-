// Stock Fácil — Alertas de Estoque
(async () => {
  const perfil = await requireAuth('admin');
  if (!perfil) return;

  const { data: produtos } = await sb.from('produtos')
    .select('nome, quantidade, estoque_minimo')
    .order('quantidade', { ascending: true });

  const lista = produtos || [];
  const box   = document.getElementById('listaAlertas');

  if (!lista.length) {
    box.innerHTML = '<div class="alert-item"><span>Nenhum produto cadastrado.</span></div>';
    return;
  }

  box.innerHTML = lista.map(p => {
    const critico = Number(p.quantidade) <= Number(p.estoque_minimo);
    const badge   = p.quantidade === 0
      ? '<span class="restam">Sem estoque!</span>'
      : critico
        ? `<span class="restam">Restam ${p.quantidade} un.</span>`
        : `<span class="ok">OK — ${p.quantidade} un.</span>`;
    return `<div class="alert-item"><span>${esc(p.nome)}</span>${badge}</div>`;
  }).join('');
})();

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
