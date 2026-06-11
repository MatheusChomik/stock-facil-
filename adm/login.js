document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const usuario = document.getElementById('usuario').value.trim();
  const senha   = document.getElementById('senha').value;
  const erro    = document.getElementById('loginError');

  // TODO: substituir por autenticação via Supabase
  if (usuario === 'admin' && senha === '1234') {
    window.location.href = 'dashboard.html';
  } else if (usuario === 'operador' && senha === '5678') {
    window.location.href = '../operador/painel.html';
  } else {
    erro.style.display = 'block';
  }
});
