// Stock Fácil — Movimentações (operador)
(async () => {
  const perfil = await requireAuth('operador');
  if (!perfil) return;

  const modal     = document.getElementById('modalMov');
  const tipoHidden = document.getElementById('movTipo');

  async function carregar() {
    const { data } = await sb.from('movimentacoes')
      .select('tipo, quantidade, responsavel, created_at, produtos(nome)')
      .order('created_at', { ascending: false });

    const tbody = document.getElementById('tbodyMovs');
    const lista = data || [];
    tbody.innerHTML = lista.length
      ? lista.map(m => `
          <tr>
            <td>${new Date(m.created_at).toLocaleDateString('pt-BR')}</td>
            <td>${esc(m.produtos?.nome ?? '—')}</td>
            <td><span class="badge badge-${m.tipo}">${m.tipo === 'entrada' ? 'Entrada' : 'Saída'}</span></td>
            <td>${m.tipo === 'entrada' ? '+' : '-'}${m.quantidade} un.</td>
            <td>${esc(m.responsavel || '—')}</td>
          </tr>`).join('')
      : '<tr><td colspan="5" class="vazio">Nenhuma movimentação registrada.</td></tr>';
  }

  async function carregarProdutos() {
    const { data } = await sb.from('produtos').select('id, nome').order('nome', { ascending: true });
    const sel = document.getElementById('movProduto');
    sel.innerHTML = '<option value="">Selecione um produto…</option>' +
      (data || []).map(p => `<option value="${p.id}">${esc(p.nome)}</option>`).join('');
  }

  function abrirModal(tipo, titulo) {
    tipoHidden.value = tipo;
    document.getElementById('modalMovTitulo').textContent = titulo;
    document.getElementById('formMov').reset();
    tipoHidden.value = tipo; // restore after reset
    modal.classList.add('aberto');
    carregarProdutos();
  }

  document.getElementById('btnEntrada').addEventListener('click', () => abrirModal('entrada', 'Nova Entrada'));
  document.getElementById('btnSaida').addEventListener('click',   () => abrirModal('saida',   'Registrar Saída'));
  document.getElementById('btnCancelarMov').addEventListener('click', () => modal.classList.remove('aberto'));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('aberto'); });

  document.getElementById('formMov').addEventListener('submit', async e => {
    e.preventDefault();
    const produtoId = document.getElementById('movProduto').value;
    const qtd       = parseInt(document.getElementById('movQtd').value, 10);
    const tipo      = tipoHidden.value;

    if (!produtoId || !qtd || qtd <= 0) return;

    const { data: prod } = await sb.from('produtos').select('quantidade').eq('id', produtoId).single();
    const atual = Number(prod?.quantidade || 0);

    if (tipo === 'saida' && atual < qtd) {
      alert('Estoque insuficiente! Disponível: ' + atual + ' un.'); return;
    }

    const novaQtd = tipo === 'entrada' ? atual + qtd : atual - qtd;
    await sb.from('produtos').update({ quantidade: novaQtd }).eq('id', produtoId);
    await sb.from('movimentacoes').insert({ produto_id: produtoId, tipo, quantidade: qtd, responsavel: perfil.nome });

    modal.classList.remove('aberto');
    carregar();
  });

  carregar();
})();

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
