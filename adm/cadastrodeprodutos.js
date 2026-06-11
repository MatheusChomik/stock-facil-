// Stock Fácil — Cadastro de produtos
(async () => {
  const perfil = await requireAuth('admin');
  if (!perfil) return;

  const form = document.getElementById('formProduto');
  const msg  = document.getElementById('msg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    mostrarMsg('', 'none');

    const produto = {
      nome:           document.getElementById('nome').value.trim(),
      quantidade:     parseInt(document.getElementById('quantidade').value, 10) || 0,
      estoque_minimo: parseInt(document.getElementById('estoqueMinimo').value, 10) || 0,
      preco_custo:    parseMoeda(document.getElementById('precoCusto').value),
      preco_venda:    parseMoeda(document.getElementById('precoVenda').value),
    };

    if (!produto.nome) {
      mostrarMsg('Informe o nome do produto.', 'erro');
      return;
    }

    const botao = form.querySelector('button[type="submit"]');
    botao.disabled = true;

    const { error } = await sb.from('produtos').insert(produto);

    botao.disabled = false;

    if (error) {
      mostrarMsg('Erro ao salvar: ' + error.message, 'erro');
      return;
    }

    mostrarMsg(`Produto "${produto.nome}" cadastrado com sucesso!`, 'sucesso');
    form.reset();
    document.getElementById('quantidade').value = 0;
    document.getElementById('estoqueMinimo').value = 0;
  });

  function mostrarMsg(texto, tipo) {
    if (tipo === 'none') { msg.style.display = 'none'; return; }
    msg.textContent = texto;
    msg.className = 'msg ' + tipo; // .msg.sucesso / .msg.erro
    msg.style.display = 'block';
  }
})();
