// Stock Fácil — login via Supabase Auth
const form = document.getElementById('loginForm');
const erro = document.getElementById('loginError');

// Se já houver sessão, pula o login e vai pro painel certo.
(async () => {
  const perfil = await getPerfil();
  if (perfil) {
    window.location.replace(perfil.papel === 'admin' ? 'dashboard.html' : '../operador/painel.html');
  }
})();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  erro.style.display = 'none';

  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;
  const botao = form.querySelector('button[type="submit"]');

  botao.disabled = true;
  botao.textContent = 'Entrando...';

  const { error } = await sb.auth.signInWithPassword({ email, password: senha });

  if (error) {
    erro.textContent = 'Email ou senha incorretos.';
    erro.style.display = 'block';
    botao.disabled = false;
    botao.textContent = 'Acessar Sistema';
    return;
  }

  // Descobre o papel pra redirecionar pro painel correto.
  const perfil = await getPerfil();
  window.location.href = (perfil && perfil.papel === 'admin')
    ? 'dashboard.html'
    : '../operador/painel.html';
});
