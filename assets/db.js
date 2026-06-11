/*!
 * Stock Fácil — banco localStorage
 * Emula o subconjunto da API do Supabase JS v2 usado pelo sistema.
 * Expõe window.sb — mesmo nome que supabase.js usava, então auth.js
 * e todas as telas funcionam sem nenhuma alteração.
 */

const USERS_KEY   = 'sf_auth_users';
const SESSION_KEY = 'sf_auth_session';

function _rows(t)       { return JSON.parse(localStorage.getItem('sf_' + t) || '[]'); }
function _save(t, data) { localStorage.setItem('sf_' + t, JSON.stringify(data)); }

// ─── QueryBuilder ────────────────────────────────────────────────────────────
class QB {
  constructor(t) {
    this._t    = t;
    this._f    = [];
    this._ord  = null;
    this._lim  = null;
    this._sing = false;
    this._sel  = '*';
  }

  select(s = '*') { this._sel = s; return this; }
  single()        { this._sing = true; return this; }
  limit(n)        { this._lim = n; return this; }
  order(col, opt) { this._ord = { col, asc: opt?.ascending !== false }; return this; }
  eq(c, v)  { this._f.push({ c, v, op: 'eq'  }); return this; }
  neq(c, v) { this._f.push({ c, v, op: 'neq' }); return this; }
  lte(c, v) { this._f.push({ c, v, op: 'lte' }); return this; }
  gte(c, v) { this._f.push({ c, v, op: 'gte' }); return this; }
  in(c, v)  { this._f.push({ c, v, op: 'in'  }); return this; }

  _applyFilters(rows) {
    return rows.filter(r => this._f.every(({ c, v, op }) => {
      if (op === 'eq')  return String(r[c]) === String(v);
      if (op === 'neq') return String(r[c]) !== String(v);
      if (op === 'lte') return Number(r[c]) <= Number(v);
      if (op === 'gte') return Number(r[c]) >= Number(v);
      if (op === 'in')  return v.includes(r[c]);
      return true;
    }));
  }

  _resolve() {
    try {
      let rows = this._applyFilters(_rows(this._t));

      // Joins simples: "col, tabela(col1,col2)"
      // ex: "quantidade, total, created_at, produtos(nome)"
      if (this._sel !== '*') {
        const joins = [...this._sel.matchAll(/(\w+)\(([^)]+)\)/g)];
        if (joins.length) {
          rows = rows.map(r => {
            const out = { ...r };
            for (const [, jTable, jCols] of joins) {
              // tenta 'produtos_id' e também 'produto_id' (sem plural)
              let fk = jTable + '_id';
              if (!(fk in r)) fk = jTable.replace(/s$/, '') + '_id';
              const rel = r[fk] ? _rows(jTable).find(x => x.id === r[fk]) : null;
              out[jTable] = rel
                ? Object.fromEntries(jCols.split(',').map(c => c.trim()).map(c => [c, rel[c]]))
                : null;
            }
            return out;
          });
        }
      }

      if (this._ord) {
        const { col, asc } = this._ord;
        rows.sort((a, b) => {
          const av = a[col] ?? '', bv = b[col] ?? '';
          return asc ? (av > bv ? 1 : av < bv ? -1 : 0) : (av < bv ? 1 : av > bv ? -1 : 0);
        });
      }

      if (this._lim != null) rows = rows.slice(0, this._lim);

      if (this._sing) {
        return rows.length
          ? { data: rows[0], error: null }
          : { data: null, error: { message: 'No rows found' } };
      }
      return { data: rows, error: null };
    } catch (e) {
      return { data: null, error: { message: e.message } };
    }
  }

  // Torna o QB "thenable" → `await sb.from('x').select('*')` funciona
  then(onFulfilled, onRejected) {
    return Promise.resolve(this._resolve()).then(onFulfilled, onRejected);
  }

  async insert(payload) {
    try {
      const arr = Array.isArray(payload) ? payload : [payload];
      const inserted = arr.map(r => ({
        ...r,
        id:         r.id         ?? crypto.randomUUID(),
        created_at: r.created_at ?? new Date().toISOString(),
      }));
      _save(this._t, [..._rows(this._t), ...inserted]);
      return { data: inserted.length === 1 ? inserted[0] : inserted, error: null };
    } catch (e) { return { data: null, error: { message: e.message } }; }
  }

  async update(payload) {
    try {
      const all  = _rows(this._t);
      const toUp = this._applyFilters(all);
      _save(this._t, all.map(r => toUp.includes(r) ? { ...r, ...payload } : r));
      return { data: toUp.map(r => ({ ...r, ...payload })), error: null };
    } catch (e) { return { data: null, error: { message: e.message } }; }
  }

  async delete() {
    try {
      const all = _rows(this._t);
      const del = this._applyFilters(all);
      _save(this._t, all.filter(r => !del.includes(r)));
      return { data: del, error: null };
    } catch (e) { return { data: null, error: { message: e.message } }; }
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
const sbAuth = {
  async getSession() {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    return { data: { session }, error: null };
  },
  async signInWithPassword({ email, password }) {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const u = users.find(x => x.email.toLowerCase() === email.toLowerCase() && x.password === password);
    if (!u) return { data: null, error: { message: 'Email ou senha incorretos.' } };
    const session = { user: { id: u.id, email: u.email }, access_token: 'local_' + Date.now() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { data: { session }, error: null };
  },
  async signOut() {
    localStorage.removeItem(SESSION_KEY);
    return { error: null };
  },
};

// ─── Objeto principal (mesmo nome que o cliente Supabase) ─────────────────────
window.sb = { from: (t) => new QB(t), auth: sbAuth };

// ─── Seed de demonstração (roda só na primeira vez) ───────────────────────────
(function seed() {
  if (localStorage.getItem('sf_seeded')) return;

  const uid  = () => crypto.randomUUID();
  const now  = () => new Date().toISOString();
  const past = (d) => { const x = new Date(); x.setDate(x.getDate() - d); return x.toISOString(); };

  const adminId = uid(), opId = uid();

  localStorage.setItem(USERS_KEY, JSON.stringify([
    { id: adminId, email: 'admin@stock.com',    password: 'admin123' },
    { id: opId,    email: 'operador@stock.com', password: 'op123'    },
  ]));

  _save('profiles', [
    { id: adminId, nome: 'Administrador', papel: 'admin',    created_at: now() },
    { id: opId,    nome: 'Operador',      papel: 'operador', created_at: now() },
  ]);

  const P = [
    { id: uid(), nome: 'Arroz Tio Urbano 5kg',  quantidade: 120, estoque_minimo: 20, preco_custo: 18.50, preco_venda: 24.90, created_at: past(60) },
    { id: uid(), nome: 'Feijão Carioca 1kg',     quantidade:   3, estoque_minimo: 10, preco_custo:  4.80, preco_venda:  7.00, created_at: past(55) },
    { id: uid(), nome: 'Óleo de Soja 900ml',     quantidade:   8, estoque_minimo: 15, preco_custo:  5.20, preco_venda:  8.50, created_at: past(50) },
    { id: uid(), nome: 'Leite Integral 1L',       quantidade:  60, estoque_minimo: 30, preco_custo:  3.90, preco_venda:  5.50, created_at: past(45) },
    { id: uid(), nome: 'Macarrão Espaguete 500g', quantidade:  45, estoque_minimo: 10, preco_custo:  2.10, preco_venda:  3.80, created_at: past(40) },
    { id: uid(), nome: 'Açúcar Cristal 1kg',      quantidade:   5, estoque_minimo: 12, preco_custo:  2.80, preco_venda:  4.50, created_at: past(35) },
  ];
  _save('produtos', P);

  // Vendas dos últimos 3 meses
  const V = [];
  for (let m = 2; m >= 0; m--) {
    for (const p of P) {
      const qtd = Math.floor(Math.random() * 25) + 5;
      const d = new Date(); d.setMonth(d.getMonth() - m);
      V.push({ id: uid(), produto_id: p.id, quantidade: qtd, total: +(qtd * p.preco_venda).toFixed(2), created_at: d.toISOString() });
    }
  }
  _save('vendas', V);

  _save('movimentacoes', P.flatMap(p => [
    { id: uid(), produto_id: p.id, tipo: 'entrada', quantidade: p.quantidade + 50, responsavel: 'Administrador', created_at: past(30) },
    { id: uid(), produto_id: p.id, tipo: 'saida',   quantidade: 50,                responsavel: 'Operador',       created_at: past(15) },
  ]));

  const pIds = [uid(), uid(), uid(), uid()];
  _save('pedidos', [
    { id: pIds[0], cliente: 'João da Silva', status: 'Pendente',     codigo_rastreamento: '',              endereco: 'Rua das Flores, 123',  transportadora: '',         created_at: past(2) },
    { id: pIds[1], cliente: 'Maria Souza',   status: 'Em Separação', codigo_rastreamento: '',              endereco: 'Av. Principal, 456',   transportadora: 'Correios', created_at: past(3) },
    { id: pIds[2], cliente: 'Pedro Costa',   status: 'Em Rota',      codigo_rastreamento: 'BR123456789BR', endereco: 'Rua Bela Vista, 789',  transportadora: 'JadLog',   created_at: past(4) },
    { id: pIds[3], cliente: 'Ana Lima',      status: 'Entregue',     codigo_rastreamento: 'BR987654321BR', endereco: 'Av. Central, 100',     transportadora: 'Correios', created_at: past(7) },
  ]);

  _save('itens_pedido', [
    { id: uid(), pedido_id: pIds[0], produto_id: P[0].id, quantidade: 5,  preco_unit: P[0].preco_venda },
    { id: uid(), pedido_id: pIds[1], produto_id: P[1].id, quantidade: 2,  preco_unit: P[1].preco_venda },
    { id: uid(), pedido_id: pIds[2], produto_id: P[2].id, quantidade: 10, preco_unit: P[2].preco_venda },
    { id: uid(), pedido_id: pIds[3], produto_id: P[3].id, quantidade: 3,  preco_unit: P[3].preco_venda },
  ]);

  localStorage.setItem('sf_seeded', '1');
})();
