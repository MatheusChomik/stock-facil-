// Stock Fácil — Gestão de Usuários (localStorage direto — sem service_role)
(async () => {
  const perfil = await requireAuth('admin');
  if (!perfil) return;

  const modal = document.getElementById('modalUsuario');

  function lerUsuarios() {
    const users    = JSON.parse(localStorage.getItem('sf_auth_users') || '[]');
    const profiles = JSON.parse(localStorage.getItem('sf_profiles')   || '[]');
    return users.map(u => {
      const p = profiles.find(x => x.id === u.id) || {};
      return { ...u, nome: p.nome || u.email, papel: p.papel || 'operador' };
    });
  }

  function render() {
    const lista  = lerUsuarios();
    const tbody  = document.getElementById('tbodyUsuarios');
    tbody.innerHTML = lista.map(u => `
      <tr>
        <td>${esc(u.nome)}</td>
        <td>${esc(u.email)}</td>
        <td><span class="badge ${u.papel === 'admin' ? 'badge-entrada' : 'badge-separacao'}">
          ${u.papel === 'admin' ? 'Administrador' : 'Operador'}</span></td>
        <td>${u.id === perfil.id
          ? '<em style="color:var(--text-muted);font-size:12px">você</em>'
          : `<button class="btn btn-danger btn-sm" onclick="excluirUser('${u.id}')">Excluir</button>`}
        </td>
      </tr>`).join('');
  }

  window.excluirUser = function(id) {
    if (!confirm('Excluir este usuário?')) return;
    const users = JSON.parse(localStorage.getItem('sf_auth_users') || '[]').filter(u => u.id !== id);
    localStorage.setItem('sf_auth_users', JSON.stringify(users));
    const profs = JSON.parse(localStorage.getItem('sf_profiles') || '[]').filter(p => p.id !== id);
    localStorage.setItem('sf_profiles', JSON.stringify(profs));
    render();
  };

  document.getElementById('btnNovoUsuario').addEventListener('click', () => {
    document.getElementById('formUsuario').reset();
    modal.classList.add('aberto');
  });
  document.getElementById('btnCancelarUsuario').addEventListener('click', fechar);
  modal.addEventListener('click', e => { if (e.target === modal) fechar(); });
  function fechar() { modal.classList.remove('aberto'); }

  document.getElementById('formUsuario').addEventListener('submit', e => {
    e.preventDefault();
    const nome  = document.getElementById('uNome').value.trim();
    const email = document.getElementById('uEmail').value.trim();
    const senha = document.getElementById('uSenha').value;
    const papel = document.getElementById('uPapel').value;

    const users = JSON.parse(localStorage.getItem('sf_auth_users') || '[]');
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      alert('Já existe um usuário com esse email.'); return;
    }

    const id = crypto.randomUUID();
    users.push({ id, email, password: senha });
    localStorage.setItem('sf_auth_users', JSON.stringify(users));

    const profs = JSON.parse(localStorage.getItem('sf_profiles') || '[]');
    profs.push({ id, nome, papel, created_at: new Date().toISOString() });
    localStorage.setItem('sf_profiles', JSON.stringify(profs));

    fechar();
    render();
  });

  render();
})();

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
