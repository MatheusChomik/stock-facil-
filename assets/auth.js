// ============================================================
// Stock Fácil — autenticação e proteção de página
// Requer que supabase.js já tenha rodado (define window.sb).
//
// Uso em cada página protegida (no script da própria tela):
//   requireAuth('admin');                 // só admin
//   requireAuth(['admin','operador']);    // ambos
// ============================================================

// Caminhos relativos dependem da pasta atual (adm/ ou operador/).
const _emOperador   = location.pathname.includes('/operador/');
const LOGIN_URL     = _emOperador ? '../adm/login.html'     : 'login.html';
const HOME_ADMIN    = _emOperador ? '../adm/dashboard.html' : 'dashboard.html';
const HOME_OPERADOR = _emOperador ? 'painel.html'           : '../operador/painel.html';

// Retorna { id, nome, papel } do usuário logado, ou null se não houver sessão.
async function getPerfil() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return null;

  const { data, error } = await sb
    .from('profiles')
    .select('id, nome, papel')
    .eq('id', session.user.id)
    .single();

  if (error) {
    console.error('Erro ao buscar perfil:', error.message);
    // Autenticado, mas sem perfil legível: papel desconhecido.
    return { id: session.user.id, nome: session.user.email, papel: null };
  }
  return data;
}

// Protege a página. `papeisPermitidos` pode ser string ('admin') ou array.
// - Sem sessão  -> manda pro login.
// - Papel errado -> manda pro painel correto do usuário.
// Retorna o perfil quando o acesso é liberado.
async function requireAuth(papeisPermitidos) {
  document.body.style.visibility = 'hidden'; // evita flash de conteúdo protegido
  const perfil = await getPerfil();

  if (!perfil) {
    window.location.replace(LOGIN_URL);
    return null;
  }

  if (papeisPermitidos) {
    const permitidos = Array.isArray(papeisPermitidos) ? papeisPermitidos : [papeisPermitidos];
    if (!permitidos.includes(perfil.papel)) {
      window.location.replace(perfil.papel === 'admin' ? HOME_ADMIN : HOME_OPERADOR);
      return null;
    }
  }

  document.body.style.visibility = ''; // libera a página
  ligarBotaoSair();
  return perfil;
}

function ligarBotaoSair() {
  const sair = document.getElementById('btnSair');
  if (sair) sair.addEventListener('click', (e) => { e.preventDefault(); logout(); });
}

async function logout() {
  await sb.auth.signOut();
  window.location.replace(LOGIN_URL);
}

// Helpers de formatação reaproveitados pelas telas.
function moedaBR(v) {
  return (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
// Converte "1.234,56" / "8,50" (pt-BR) -> Number. Vazio -> null.
function parseMoeda(str) {
  if (str == null || String(str).trim() === '') return null;
  const n = parseFloat(String(str).replace(/\./g, '').replace(',', '.'));
  return isNaN(n) ? null : n;
}

window.getPerfil   = getPerfil;
window.requireAuth = requireAuth;
window.logout      = logout;
window.moedaBR     = moedaBR;
window.parseMoeda  = parseMoeda;
