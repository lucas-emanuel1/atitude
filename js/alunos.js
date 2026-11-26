exigirLogin().then((logado) => {
  if (logado) carregar();
});

/* ELEMENTOS */
const busca = document.getElementById('busca');
const contagem = document.getElementById('contagem');
const listaEl = document.getElementById('lista');
const toast = document.getElementById('toast');

const modal = document.getElementById('modal');
const modalTitulo = document.getElementById('modalTitulo');
const form = document.getElementById('formAluno');
const btnSalvar = form.querySelector('button[type="submit"]');
const btnExcluir = document.getElementById('excluir');

let todos = [];
let alunoAtual = null;

/* AUXILIARES */
function normalizar(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function mostrarToast(mensagem, tipo = 'ok') {
  const cores = { ok: '#2e7d32', erro: '#d93025', info: '#524ca8' };
  toast.textContent = mensagem;
  toast.style.background = cores[tipo];
  toast.classList.add('visivel');
  setTimeout(() => toast.classList.remove('visivel'), 2800);
}

function mostrarErro(campo, mensagem) {
  const span = document.querySelector(`[data-erro="${campo}"]`);
  span.textContent = mensagem;
  span.closest('.campo').classList.toggle('invalido', Boolean(mensagem));
}

function limparErros() {
  document.querySelectorAll('[data-erro]').forEach((span) => {
    span.textContent = '';
    span.closest('.campo').classList.remove('invalido');
  });
}

/* MÁSCARAS */
function aplicarMascara(id, funcao) {
  const input = document.getElementById(id);
  input.addEventListener('input', () => {
    input.value = funcao(input.value);
  });
}

aplicarMascara('nascimento', mascaraData);
aplicarMascara('cpf', mascaraCPF);
aplicarMascara('telefone', mascaraTelefone);

/* CARREGAR E DESENHAR A LISTA */
async function carregar() {
  listaEl.innerHTML = '<p class="vazio">Carregando...</p>';

  try {
    todos = await buscarAlunos();
  } catch (erro) {
    console.error(erro);
    listaEl.innerHTML = '<p class="vazio">Não foi possível carregar os alunos.</p>';
    mostrarToast('Erro ao carregar os alunos.', 'erro');
    return;
  }

  desenhar();
}

function desenhar() {
  const termo = normalizar(busca.value);
  const digitos = somenteNumeros(busca.value);

  const achados = todos.filter((aluno) =>
    !termo ||
    normalizar(aluno.nome).includes(termo) ||
    (digitos && somenteNumeros(aluno.cpf).includes(digitos))
  );

  contagem.textContent = `${achados.length} ${achados.length === 1 ? 'aluno' : 'alunos'}`;
  listaEl.innerHTML = '';

  if (achados.length === 0) {
    listaEl.innerHTML = '<p class="vazio">Nenhum aluno encontrado.</p>';
    return;
  }

  achados.forEach((aluno) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'aluno-card';

    const nome = document.createElement('strong');
    nome.textContent = aluno.nome;

    const info = document.createElement('small');
    info.textContent = `CPF ${aluno.cpf} · ${aluno.telefone} · Cat. ${aluno.categoria}`;

    card.append(nome, info);
    card.addEventListener('click', () => abrirModal(aluno));
    listaEl.appendChild(card);
  });
}

busca.addEventListener('input', desenhar);

/* MODAL */
function abrirModal(aluno) {
  alunoAtual = aluno;
  limparErros();

  modalTitulo.textContent = aluno.nome;
  form.nome.value = aluno.nome;
  form.nascimento.value = aluno.nascimento;
  form.cpf.value = aluno.cpf;
  form.categoria.value = aluno.categoria;
  form.escolaridade.value = aluno.escolaridade;
  form.email.value = aluno.email;
  form.telefone.value = aluno.telefone;

  modal.hidden = false;
  document.body.classList.add('sem-scroll');
}

function fecharModal() {
  modal.hidden = true;
  document.body.classList.remove('sem-scroll');
  alunoAtual = null;
}

document.getElementById('fecharModal').addEventListener('click', fecharModal);

modal.addEventListener('click', (evento) => {
  if (evento.target === modal) fecharModal();
});

document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape' && !modal.hidden) fecharModal();
});

/* SALVAR ALTERAÇÕES */
form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  limparErros();

  const dados = {
    nome: form.nome.value.trim(),
    nascimento: form.nascimento.value.trim(),
    cpf: form.cpf.value.trim(),
    categoria: form.categoria.value,
    escolaridade: form.escolaridade.value,
    email: form.email.value.trim(),
    telefone: form.telefone.value.trim(),
  };

  let valido = true;

  if (dados.nome.length < 3) {
    mostrarErro('nome', 'Informe o nome completo.');
    valido = false;
  }
  if (!validarData(dados.nascimento)) {
    mostrarErro('nascimento', 'Informe uma data válida (dd/mm/aaaa).');
    valido = false;
  }
  if (!validarCPF(dados.cpf)) {
    mostrarErro('cpf', 'CPF inválido.');
    valido = false;
  }
  if (!dados.categoria) {
    mostrarErro('categoria', 'Selecione a categoria.');
    valido = false;
  }
  if (!dados.escolaridade) {
    mostrarErro('escolaridade', 'Selecione a escolaridade.');
    valido = false;
  }
  if (!validarEmail(dados.email)) {
    mostrarErro('email', 'Informe um e-mail válido.');
    valido = false;
  }
  if (!validarTelefone(dados.telefone)) {
    mostrarErro('telefone', 'Informe um telefone válido com DDD.');
    valido = false;
  }

  if (!valido) {
    mostrarToast('Confira os campos destacados.', 'erro');
    return;
  }

  btnSalvar.disabled = true;
  btnSalvar.textContent = 'Salvando...';

  try {
    await atualizarAluno(alunoAtual.id, dados);
  } catch (erro) {
    if (erro.code === '23505') {
      mostrarErro('cpf', 'Já existe outro aluno com este CPF.');
      mostrarToast('CPF já cadastrado.', 'erro');
    } else {
      console.error(erro);
      mostrarToast('Não foi possível salvar. Tente novamente.', 'erro');
    }
    return;
  } finally {
    btnSalvar.disabled = false;
    btnSalvar.textContent = 'Salvar alterações';
  }

  Object.assign(alunoAtual, dados);
  todos.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  fecharModal();
  desenhar();
  mostrarToast('Dados atualizados com sucesso!');
});

/* EXCLUIR ALUNO */
btnExcluir.addEventListener('click', async () => {
  const aluno = alunoAtual;
  btnExcluir.disabled = true;

  try {
    const aulas = await contarAulasDoAluno(aluno.id);

    const aviso = aulas > 0
      ? `Excluir ${aluno.nome}?\n\nAs ${aulas} ${aulas === 1 ? 'aula marcada' : 'aulas marcadas'} deste aluno também serão apagadas.\nEsta ação não pode ser desfeita.`
      : `Excluir ${aluno.nome}?\n\nEsta ação não pode ser desfeita.`;

    if (!confirm(aviso)) return;

    await removerAluno(aluno.id);
  } catch (erro) {
    console.error(erro);
    mostrarToast('Não foi possível excluir o aluno.', 'erro');
    return;
  } finally {
    btnExcluir.disabled = false;
  }

  todos = todos.filter((item) => item.id !== aluno.id);
  fecharModal();
  desenhar();
  mostrarToast('Aluno excluído.');
});