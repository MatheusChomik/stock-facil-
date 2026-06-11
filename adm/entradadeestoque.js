// Stock Fácil — Entrada de estoque
(async () => {
  const perfil = await requireAuth('admin');
  if (!perfil) return;

  const form = document.getElementById('formEntrada');
  const sel  = document.getElementById('selProduto');
  const msg  = document.getElementById('msg');

  // Popula o dropdown com os produtos.
  async function carregarProdutos() {
    const { data, error } = await sb
      .from('produtos')
      .select('id, nome, quantidade')
      .order('nome', { ascending: true });

    if (error) { mostrarMsg('Erro ao carregar produtos: ' + error.message, 'erro'); return; }

    if (!data || data.length === 0) {
      sel.innerHTML = '<option value="">Nenhum produto cadastrado</option>';
      return;
    }
    sel.innerHTML = '<option value="">Selecione um produto…</option>' +
      data.map(p => `<option value="${p.id}" data-qtd="${p.quantidade}">${escapeHtml(p.nome)} (estoque: ${p.quantidade})</option>`).join('');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    mostrarMsg('', 'none');

    const produtoId = sel.value;
    const qtd = parseInt(document.getElementById('qtdEntrada').value, 10);

    if (!produtoId) { mostrarMsg('Selecione um produto.', 'erro'); return; }
    if (!qtd || qtd <= 0) { mostrarMsg('Informe uma quantidade válida.', 'erro'); return; }

    const botao = form.querySelector('button[type="submit"]');
    botao.disabled = true;

    // Lê o estoque atual, soma a entrada e atualiza.
    const { data: prod, error: errGet } = await sb
      .from('produtos').select('quantidade').eq('id', produtoId).single();

    if (errGet) { mostrarMsg('Erro: ' + errGet.message, 'erro'); botao.disabled = false; return; }

    const novaQtd = Number(prod.quantidade) + qtd;

    const { error: errUp } = await sb
      .from('produtos').update({ quantidade: novaQtd }).eq('id', produtoId);

    if (errUp) { mostrarMsg('Erro ao atualizar estoque: ' + errUp.message, 'erro'); botao.disabled = false; return; }

    // Registra a movimentação.
    const { error: errMov } = await sb.from('movimentacoes').insert({
      produto_id: produtoId,
      tipo: 'entrada',
      quantidade: qtd,
      responsavel: perfil.nome,
    });
    if (errMov) console.error('movimentação:', errMov.message);

    mostrarMsg(`Entrada de ${qtd} un. registrada. Novo estoque: ${novaQtd}.`, 'sucesso');
    form.reset();
    botao.disabled = false;
    carregarProdutos(); // atualiza os estoques mostrados no dropdown
  });

  function mostrarMsg(texto, tipo) {
    if (tipo === 'none') { msg.style.display = 'none'; return; }
    msg.textContent = texto;
    msg.className = 'msg ' + tipo;
    msg.style.display = 'block';
  }

  carregarProdutos();
})();

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
