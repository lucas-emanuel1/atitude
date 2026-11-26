const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* LOGIN */
async function exigirLogin() {
  const { data } = await db.auth.getSession();
  if (!data.session) {
    location.replace('login.html');
    return false;
  }
  return true;
}

async function sair() {
  await db.auth.signOut();
  location.replace('login.html');
}

/* CONVERSÕES */
function dataParaISO(br) {
  const [d, m, a] = br.split('/');
  return `${a}-${m}-${d}`;
}

function isoParaBR(iso) {
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

function alunoDoBanco(r) {
  return {
    id: r.id,
    nome: r.nome,
    nascimento: isoParaBR(r.nascimento),
    cpf: r.cpf,
    categoria: r.categoria,
    escolaridade: r.escolaridade,
    email: r.email,
    telefone: r.telefone,
  };
}

function aulaDoBanco(r) {
  return {
    id: r.id,
    alunoId: r.aluno_id,
    data: r.data,
    hora: r.hora_inicio.slice(0, 5),
    fim: r.hora_fim.slice(0, 5),
    numero: r.numero,
  };
}

/* ALUNOS */
async function buscarAlunos() {
  const { data, error } = await db.from('alunos').select('*').order('nome');
  if (error) throw error;
  return data.map(alunoDoBanco);
}

async function criarAluno(d) {
  const { error } = await db.from('alunos').insert({
    nome: d.nome,
    nascimento: dataParaISO(d.nascimento),
    cpf: d.cpf,
    categoria: d.categoria,
    escolaridade: d.escolaridade,
    email: d.email,
    telefone: d.telefone,
  });
  if (error) throw error;
}

/* AULAS */
async function buscarAulas(filtros = {}) {
  let consulta = db.from('aulas').select('*').order('data').order('hora_inicio');
  if (filtros.alunoId) consulta = consulta.eq('aluno_id', filtros.alunoId);
  if (filtros.data) consulta = consulta.eq('data', filtros.data);

  const { data, error } = await consulta;
  if (error) throw error;
  return data.map(aulaDoBanco);
}

// Lista: [{ alunoId, data, hora, fim, numero }] — salva tudo ou nada
async function criarAulas(lista) {
  const linhas = lista.map((a) => ({
    aluno_id: a.alunoId,
    data: a.data,
    hora_inicio: a.hora,
    hora_fim: a.fim,
    numero: a.numero,
  }));
  const { error } = await db.from('aulas').insert(linhas);
  if (error) throw error;
}

async function atualizarAula(id, { data, hora, fim }) {
  const { error } = await db
    .from('aulas')
    .update({ data, hora_inicio: hora, hora_fim: fim })
    .eq('id', id);
  if (error) throw error;
}

async function removerAula(id) {
  const { error } = await db.from('aulas').delete().eq('id', id);
  if (error) throw error;
}

// O banco recusou por sobreposição de horário
function erroDeConflito(erro) {
  return Boolean(erro) && erro.code === '23P01';
}

// Aulas de um período, já com o nome do aluno
async function buscarAulasPeriodo(inicio, fim) {
  const { data, error } = await db
    .from('aulas')
    .select('*, alunos(nome)')
    .gte('data', inicio)
    .lte('data', fim)
    .order('data')
    .order('hora_inicio');
  if (error) throw error;

  return data.map((r) => ({
    ...aulaDoBanco(r),
    alunoNome: r.alunos ? r.alunos.nome : 'Aluno removido',
  }));
}

async function atualizarAluno(id, d) {
  const { error } = await db
    .from('alunos')
    .update({
      nome: d.nome,
      nascimento: dataParaISO(d.nascimento),
      cpf: d.cpf,
      categoria: d.categoria,
      escolaridade: d.escolaridade,
      email: d.email,
      telefone: d.telefone,
    })
    .eq('id', id);
  if (error) throw error;
}

async function contarAulasDoAluno(id) {
  const { count, error } = await db
    .from('aulas')
    .select('*', { count: 'exact', head: true })
    .eq('aluno_id', id);
  if (error) throw error;
  return count || 0;
}

// Apaga o aluno e, junto, todas as aulas dele (on delete cascade)
async function removerAluno(id) {
  const { error } = await db.from('alunos').delete().eq('id', id);
  if (error) throw error;
}