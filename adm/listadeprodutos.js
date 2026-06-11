// Stock Fácil — Lista de produtos (listar / editar / excluir)
(async () => {
  const perfil = await requireAuth('admin');
  if (!perfil) return;

  const tbody  = document.getElementById('tbodyProdutos');
  const busca  = document.getElementById('busca');
  const modal  = document.getElementById('modalEditar');

  let produtos = []; // cache local pra busca e edição

  async function carregar() {
    const { data, error } = await sb
      .from('produtos')
      .select('id, nome, quantidade, estoque_minimo, preco_venda')
      .order('created_at', { ascending: true });

    if (error) {
      tbody.innerHTML = `<tr><td colspan="6" class="vazio">Erro: ${escapeHtml(error.message)}</td></tr>`;
      return;
    }
    produtos = data || [];
    render(produtos);
  }

  function render(lista) {
    if (lista.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="vazio">Nenhum produto cadastrado.</td></tr>';
      return;
    }
    tbody.innerHTML = lista.map((p, i) => {
      const critico = Number(p.quantidade) <= Number(p.estoque_minimo);
      return `
        <tr>
          <td>#${String(i + 1).padStart(2, '0')}</td>
          <td>${escapeHtml(p.nome)}</td>
          <td style="${critico ? 'color:var(--danger);font-weight:700' : ''}">${p.quantidade}</td>
          <td>${p.estoque_minimo}</td>
          <td>${moedaBR(p.preco_venda)}</td>
          <td>
            <button class="btn btn-secondary btn-sm" data-acao="editar" data-id="${p.id}">Editar</button>
            <button class="btn btn-danger btn-sm" data-acao="excluir" data-id="${p.id}">Excluir</button>
          </td>
        </tr>`;
    }).join('');
  }

  // Filtro de busca (local, após o fetch)
  busca.addEventListener('input', () => {
    const termo = busca.value.trim().toLowerCase();
    render(produtos.filter(p => p.nome.toLowerCase().includes(termo)));
  });

  // Delegação de clique nos botões da tabela
  tbody.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-acao]');
    if (!btn) return;
    const id = btn.dataset.id;

    if (btn.dataset.acao === 'excluir') {
      const prod = produtos.find(p => p.id === id);
      if (!confirm(`Excluir "${prod ? prod.nome : 'produto'}"? Esta ação não pode ser desfeita.`)) return;
      const { error } = await sb.from('produtos').delete().eq('id', id);
      if (error) { alert('Erro ao excluir: ' + error.message); return; }
      carregar();
    }

    if (btn.dataset.acao === 'editar') {
      abrirEdicao(id);
    }
  });

  // ---- Modal de edição ----
  function abrirEdicao(id) {
    const p = produtos.find(x => x.id === id);
    if (!p) return;
    document.getElementById('editId').value          = p.id;
    document.getElementById('editNome').value         = p.nome;
    document.getElementById('editQuantidade').value   = p.quantidade;
    document.getElementById('editMinimo').value       = p.estoque_minimo;
    document.getElementById('editVenda').value        = p.preco_venda ?? '';
    document.getElementById('editCusto').value        = ''; // custo não vem na lista; opcional preencher
    modal.classList.add('aberto');
  }

  function fecharEdicao() { modal.classList.remove('aberto'); }

  document.getElementById('btnCancelarEdicao').addEventListener('click', fecharEdicao);
  modal.addEventListener('click', (e) => { if (e.target === modal) fecharEdicao(); });

  document.getElementById('btnSalvarEdicao').addEventListener('click', async () => {
    const id = document.getElementById('editId').value;
    const update = {
      nome:           document.getElementById('editNome').value.trim(),
      quantidade:     parseInt(document.getElementById('editQuantidade').value, 10) || 0,
      estoque_minimo: parseInt(document.getElementById('editMinimo').value, 10) || 0,
      preco_venda:    parseMoeda(document.getElementById('editVenda').value),
    };
    const custo = parseMoeda(document.getElementById('editCusto').value);
    if (custo !== null) update.preco_custo = custo;

    if (!update.nome) { alert('Informe o nome.'); return; }

    const { error } = await sb.from('produtos').update(update).eq('id', id);
    if (error) { alert('Erro ao salvar: ' + error.message); return; }
    fecharEdicao();
    carregar();
  });

  carregar();
})();

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
