/* ELEMENTOS */
const busca = document.getElementById('busca');
const resultado = document.getElementById('resultado');
const toast = document.getElementById('toast');

const modal = document.getElementById('modal');
const modalNome = document.getElementById('modalNome');
const contador = document.getElementById('contador');
const quantidadeEl = document.getElementById('quantidade');
const btnMenos = document.getElementById('menos');
const btnMais = document.getElementById('mais');
const dataTexto = document.getElementById('dataTexto');
const mesAno = document.getElementById('mesAno');
const btnMesAnterior = document.getElementById('mesAnterior');
const btnMesSeguinte = document.getElementById('mesSeguinte');
const diasEl = document.getElementById('dias');
const selHora = document.getElementById('hora');
const selMinuto = document.getElementById('minuto');
const dica = document.getElementById('dica');
const btnAdicionar = document.getElementById('adicionar');
const listaBox = document.getElementById('listaBox');
const listaEl = document.getElementById('lista');
const btnSalvar = document.getElementById('salvar');

/* REGRAS DA AUTOESCOLA */
const DURACAO_AULA = 50;
const MAX_AULAS_DIA = 2;
const ABERTURA = 6 * 60;
const FECHAMENTO = 22 * 60;
const MAX_AULAS = 50;

/* CONSTANTES */
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const DIAS_SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
  'quinta-feira', 'sexta-feira', 'sábado'];

const ICONE_MARCAR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4"/></svg>`;
const ICONE_EDITAR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>`;

/* ESTADO DO MODAL */
const estado = {
  aluno: null,
  quantidade: 10,
  dias: [],
  mes: null,
  data: null,
};

/* FUNÇÕES AUXILIARES */
function pad(n) {
  return String(n).padStart(2, '0');
}

function paraMinutos(hora) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

function paraHora(minutos) {
  return `${pad(Math.floor(minutos / 60))}:${pad(minutos % 60)}`;
}

function paraISO(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function lerISO(iso) {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

function dataBR(iso) {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

function dataExtenso(iso) {
  const d = lerISO(iso);
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

function normalizar(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function textoAulas(qtd) {
  return `${qtd} ${qtd === 1 ? 'aula' : 'aulas'}`;
}

function mostrarToast(mensagem, tipo = 'ok') {
  const cores = { ok: '#2e7d32', erro: '#d93025', info: '#524ca8' };
  toast.textContent = mensagem;
  toast.style.background = cores[tipo];
  toast.classList.add('visivel');
  setTimeout(() => toast.classList.remove('visivel'), 2800);
}

/* Quantas aulas já foram escolhidas e quantas faltam */
function aulasEscolhidas() {
  return estado.dias.reduce((soma, dia) => soma + dia.qtd, 0);
}

function aulasRestantes() {
  return estado.quantidade - aulasEscolhidas();
}

/* Quantas aulas o próximo dia terá (2, ou 1 se faltar só uma) */
function qtdProximoDia() {
  return Math.min(MAX_AULAS_DIA, aulasRestantes());
}

/* Monta as aulas de um dia a partir do horário de início. */
function montarAulasDoDia(hora, qtd) {
  const inicio = paraMinutos(hora);
  const aulas = [];
  for (let i = 0; i < qtd; i++) {
    aulas.push({
      inicio: paraHora(inicio + i * DURACAO_AULA),
      fim: paraHora(inicio + (i + 1) * DURACAO_AULA),
    });
  }
  return aulas;
}

function fimDoDia(hora, qtd) {
  return paraHora(paraMinutos(hora) + qtd * DURACAO_AULA);
}

function haSobreposicao(inicioA, fimA, inicioB, fimB) {
  return inicioA < fimB && inicioB < fimA;
}

/* LOGIN E CARGA DE ALUNOS */
let todosAlunos = [];

async function carregarAlunos() {
  try {
    todosAlunos = await buscarAlunos();
  } catch (erro) {
    console.error(erro);
    mostrarToast('Erro ao carregar os alunos.', 'erro');
  }
}

exigirLogin().then((logado) => {
  if (logado) carregarAlunos();
});

/* PESQUISA DE ALUNOS */
function pesquisar() {
  const termo = normalizar(busca.value);

  if (!termo) {
    resultado.hidden = true;
    resultado.innerHTML = '';
    return;
  }

  const achados = todosAlunos
    .filter((aluno) => normalizar(aluno.nome).includes(termo))
    .slice(0, 5);

  resultado.hidden = false;

  if (achados.length === 0) {
    resultado.innerHTML = '<p class="vazio">Nenhum aluno encontrado.</p>';
    return;
  }

  resultado.innerHTML = '<p class="resultado__rotulo">Aluno(a)</p>';

  achados.forEach((aluno) => {
    const item = document.createElement('div');
    item.className = 'aluno';

    const btnNome = document.createElement('button');
    btnNome.type = 'button';
    btnNome.className = 'aluno__nome';
    btnNome.textContent = aluno.nome;

    const opcoes = document.createElement('div');
    opcoes.className = 'aluno__opcoes';
    opcoes.innerHTML = `
      <button type="button" class="opcao" data-acao="marcar">${ICONE_MARCAR}<span>Marcar aulas</span></button>
      <button type="button" class="opcao" data-acao="editar">${ICONE_EDITAR}<span>Editar aulas</span></button>
    `;

    btnNome.addEventListener('click', () => {
      const jaAberto = item.classList.contains('aberto');
      resultado.querySelectorAll('.aluno.aberto').forEach((el) => el.classList.remove('aberto'));
      if (!jaAberto) item.classList.add('aberto');
    });

    opcoes.querySelector('[data-acao="marcar"]').addEventListener('click', () => abrirModal(aluno));
    opcoes.querySelector('[data-acao="editar"]').addEventListener('click', () => abrirEdicao(aluno));

    item.append(btnNome, opcoes);
    resultado.appendChild(item);
  });
}

busca.addEventListener('input', pesquisar);

/* MODAL: ABRIR E FECHAR */
function abrirModal(aluno) {
  const hoje = new Date();

  estado.aluno = aluno;
  estado.quantidade = 10;
  estado.dias = [];
  estado.data = null;
  estado.mes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  modalNome.textContent = aluno.nome;
  dataTexto.textContent = 'Selecione no calendário';
  selHora.value = '08';
  selMinuto.value = '00';

  renderCalendario();
  renderLista();
  atualizarResumo();

  modal.hidden = false;
  document.body.classList.add('sem-scroll');
}

function fecharModal(pedirConfirmacao = true) {
  if (pedirConfirmacao && estado.dias.length > 0) {
    if (!confirm('Descartar as aulas escolhidas?')) return;
  }
  modal.hidden = true;
  document.body.classList.remove('sem-scroll');
}

document.getElementById('fecharModal').addEventListener('click', () => fecharModal());

modal.addEventListener('click', (evento) => {
  if (evento.target === modal) fecharModal();
});

document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape' && !modal.hidden) fecharModal();
});

/* HORÁRIOS (selects) */
for (let h = ABERTURA / 60; h < FECHAMENTO / 60; h++) {
  selHora.add(new Option(pad(h), pad(h)));
}
for (let m = 0; m < 60; m += 5) {
  selMinuto.add(new Option(pad(m), pad(m)));
}

function horaEscolhida() {
  return `${selHora.value}:${selMinuto.value}`;
}

/* Mostra abaixo do horário como ficam as aulas do próximo dia */
function atualizarDica() {
  const qtd = qtdProximoDia();

  if (qtd <= 0) {
    dica.classList.remove('erro-horario');
    dica.textContent = 'Todas as aulas já foram escolhidas.';
    return;
  }

  const hora = horaEscolhida();

  if (paraMinutos(hora) + qtd * DURACAO_AULA > FECHAMENTO) {
    dica.textContent = `Esse horário passa das ${paraHora(FECHAMENTO)}. Escolha um início mais cedo.`;
    dica.classList.add('erro-horario');
    return;
  }

  dica.classList.remove('erro-horario');
  dica.innerHTML = montarAulasDoDia(hora, qtd)
    .map((aula, i) => `Aula ${i + 1}: ${aula.inicio} às ${aula.fim}`)
    .join('<br>');
}

selHora.addEventListener('change', atualizarDica);
selMinuto.addEventListener('change', atualizarDica);

/* QUANTIDADE DE AULAS (de 1 em 1) */
btnMenos.addEventListener('click', () => {
  if (estado.quantidade > Math.max(1, aulasEscolhidas())) {
    estado.quantidade--;
    atualizarResumo();
  }
});

btnMais.addEventListener('click', () => {
  if (estado.quantidade < MAX_AULAS) {
    estado.quantidade++;
    atualizarResumo();
  }
});

/* CALENDÁRIO */
function renderCalendario() {
  const ano = estado.mes.getFullYear();
  const mes = estado.mes.getMonth();
  const hoje = new Date();
  const hojeISO = paraISO(hoje);

  mesAno.textContent = `${MESES[mes]} ${ano}`;

  btnMesAnterior.disabled = ano < hoje.getFullYear() ||
    (ano === hoje.getFullYear() && mes <= hoje.getMonth());

  const deslocamento = (new Date(ano, mes, 1).getDay() + 6) % 7;
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const totalCelulas = Math.ceil((deslocamento + diasNoMes) / 7) * 7;
  const datasMarcadas = estado.dias.map((dia) => dia.data);

  diasEl.innerHTML = '';

  for (let i = 0; i < totalCelulas; i++) {
    const d = new Date(ano, mes, 1 - deslocamento + i);
    const iso = paraISO(d);
    const foraDoMes = d.getMonth() !== mes;

    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'dia';
    botao.textContent = d.getDate();

    if (foraDoMes || iso < hojeISO) {
      botao.disabled = true;
    } else {
      botao.addEventListener('click', () => {
        estado.data = iso;
        dataTexto.textContent = dataExtenso(iso);
        renderCalendario();
      });
    }

    if (iso === hojeISO && !foraDoMes) botao.classList.add('hoje');
    if (iso === estado.data && !foraDoMes) botao.classList.add('selecionado');
    if (datasMarcadas.includes(iso) && !foraDoMes) botao.classList.add('marcado');

    diasEl.appendChild(botao);
  }
}

btnMesAnterior.addEventListener('click', () => {
  estado.mes = new Date(estado.mes.getFullYear(), estado.mes.getMonth() - 1, 1);
  renderCalendario();
});

btnMesSeguinte.addEventListener('click', () => {
  estado.mes = new Date(estado.mes.getFullYear(), estado.mes.getMonth() + 1, 1);
  renderCalendario();
});

/* CONFLITOS DE HORÁRIO */
function verificarConflito(data, hora, qtd) {
async function verificarConflito(data, hora, qtd) {
  const novoInicio = paraMinutos(hora);
  const novoFim = novoInicio + qtd * DURACAO_AULA;

  // 1) conflito com os dias já escolhidos neste modal
  const conflitoLocal = estado.dias.some((dia) => {
    if (dia.data !== data) return false;
    const inicio = paraMinutos(dia.hora);
    return haSobreposicao(novoInicio, novoFim, inicio, inicio + dia.qtd * DURACAO_AULA);
  });
  if (conflitoLocal) {
    return 'Esse horário se sobrepõe a um dia que você já escolheu.';
  }

  // 2) conflito com outras aulas do MESMO aluno no banco
  const doDia = await buscarAulas({ data, alunoId: estado.aluno.id });
  const conflitoSalvo = doDia.find((aula) => {
    const inicio = paraMinutos(aula.hora);
    return haSobreposicao(novoInicio, novoFim, inicio, inicio + DURACAO_AULA);
  });

  if (conflitoSalvo) {
    return `Este aluno já tem aula às ${conflitoSalvo.hora} nesse dia.`;
  }

  return null;
}
}

/* ADICIONAR DIA DE AULA */
btnAdicionar.addEventListener('click', async () => {
  if (!estado.data) {
    mostrarToast('Escolha uma data no calendário.', 'erro');
    return;
  }

  const qtd = qtdProximoDia();

  if (qtd <= 0) {
    mostrarToast(`Você já escolheu as ${estado.quantidade} aulas.`, 'erro');
    return;
  }

  const hora = horaEscolhida();

  if (paraMinutos(hora) + qtd * DURACAO_AULA > FECHAMENTO) {
    mostrarToast(`As aulas precisam terminar até as ${paraHora(FECHAMENTO)}.`, 'erro');
    return;
  }

  const agora = new Date();
  const agoraMin = agora.getHours() * 60 + agora.getMinutes();
  if (estado.data === paraISO(agora) && paraMinutos(hora) <= agoraMin) {
    mostrarToast('Este horário de hoje já passou.', 'erro');
    return;
  }

  let conflito;
  try {
    conflito = await verificarConflito(estado.data, hora, qtd);
  } catch (erro) {
    console.error(erro);
    mostrarToast('Erro ao verificar os horários.', 'erro');
    return;
  }
  if (conflito) {
    mostrarToast(conflito, 'erro');
    return;
  }

  estado.dias.push({ data: estado.data, hora, qtd });
  estado.dias.sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));

  renderLista();
  renderCalendario();
  atualizarResumo();
});

/* LISTA DE DIAS ESCOLHIDOS */
function renderLista() {
  listaEl.innerHTML = '';
  listaBox.hidden = estado.dias.length === 0;

  estado.dias.forEach((dia, indice) => {

    const li = document.createElement('li');

    const texto = document.createElement('span');
    texto.textContent =
    `${dataBR(dia.data)} - (${dia.hora} → ${fimDoDia(dia.hora, dia.qtd)})`;

    const remover = document.createElement('button');
    remover.type = 'button';
    remover.setAttribute('aria-label', 'Remover dia');
    remover.innerHTML = '&times;';
    remover.addEventListener('click', () => {
      estado.dias.splice(indice, 1);
      renderLista();
      renderCalendario();
      atualizarResumo();
    });

    li.append(texto, remover);
    listaEl.appendChild(li);
  });
}

/* RESUMO (contador, quantidade, dica e botão salvar) */
function atualizarResumo() {
  const feitas = aulasEscolhidas();
  const total = estado.quantidade;

  contador.textContent = `${feitas} de ${textoAulas(total)}`;

  quantidadeEl.textContent = total;

  btnMenos.disabled = total <= Math.max(1, feitas);
  btnMais.disabled = total >= MAX_AULAS;

  btnSalvar.disabled = feitas !== total;
  btnSalvar.textContent = feitas === total ? 'Salvar aulas' : `Salvar aulas (${feitas}/${total})`;

  atualizarDica();
}

/* SALVAR */
btnSalvar.addEventListener('click', async () => {
  const novas = [];

  estado.dias.forEach((dia) => {
    montarAulasDoDia(dia.hora, dia.qtd).forEach((aula, numero) => {
      novas.push({
        alunoId: estado.aluno.id,
        data: dia.data,
        hora: aula.inicio,
        fim: aula.fim,
        numero: numero + 1,
      });
    });
  });

  btnSalvar.disabled = true;
  btnSalvar.textContent = 'Salvando...';

  try {
    await criarAulas(novas);
  } catch (erro) {
    if (erroDeConflito(erro)) {
      mostrarToast('Este aluno já tem aula em algum desses horários. Revise as aulas.', 'erro');
    } else {
      console.error(erro);
      mostrarToast('Não foi possível salvar as aulas.', 'erro');
    }
    atualizarResumo();
    return;
  }

  const quantidade = aulasEscolhidas();
  fecharModal(false);
  busca.value = '';
  pesquisar();
  mostrarToast(`${textoAulas(quantidade)} ${quantidade === 1 ? 'marcada' : 'marcadas'} com sucesso!`);
});

/* IMPRIMIR */
/* ========== IMPRESSÃO (marcar e editar) ========== */
// blocos: [{ data, hora, fim, qtd }]
function preencherFolha(aluno, blocos) {
  const hoje = new Date();

  document.getElementById('folhaEmissao').textContent =
    `Emitido em ${dataBR(paraISO(hoje))} às ${pad(hoje.getHours())}:${pad(hoje.getMinutes())}`;
  document.getElementById('folhaNome').textContent = aluno.nome;
  document.getElementById('folhaCpf').textContent = aluno.cpf;
  document.getElementById('folhaCategoria').textContent = aluno.categoria;

  const corpo = document.getElementById('folhaCorpo');
  corpo.innerHTML = '';

  let total = 0;

  blocos.forEach((bloco, i) => {
    const semana = DIAS_SEMANA[lerISO(bloco.data).getDay()];
    const linha = document.createElement('tr');
    total += bloco.qtd;

    [
      i + 1,
      dataBR(bloco.data),
      semana.charAt(0).toUpperCase() + semana.slice(1),
      `${bloco.hora} → ${bloco.fim}`,
      bloco.qtd,
    ].forEach((valor) => {
      const celula = document.createElement('td');
      celula.textContent = valor;
      linha.appendChild(celula);
    });

    corpo.appendChild(linha);
  });

  document.getElementById('folhaTotal').textContent = `Total: ${textoAulas(total)}`;
}

// Imprimir a partir de "Marcar aulas"
document.getElementById('imprimir').addEventListener('click', () => {
  const blocos = estado.dias.map((dia) => ({
    data: dia.data,
    hora: dia.hora,
    fim: fimDoDia(dia.hora, dia.qtd),
    qtd: dia.qtd,
  }));

  preencherFolha(estado.aluno, blocos);
  window.print();
});

// Junta aulas seguidas do mesmo dia
function agruparAulas(aulas) {
  const blocos = [];

  aulas.forEach((aula) => {
    const fim = fimDaAula(aula);
    const anterior = blocos[blocos.length - 1];

    if (anterior && anterior.data === aula.data && anterior.fim === aula.hora) {
      anterior.fim = fim;
      anterior.qtd++;
    } else {
      blocos.push({ data: aula.data, hora: aula.hora, fim, qtd: 1 });
    }
  });

  return blocos;
}

// Imprimir a partir de "Editar aulas"
document.getElementById('imprimirEdicao').addEventListener('click', () => {
  const aulas = estadoEdicao.aulas || [];
  if (aulas.length === 0) return;

  preencherFolha(estadoEdicao.aluno, agruparAulas(aulas));
  window.print();
});

document.getElementById('imprimir').addEventListener('click', () => {
  window.print();
});

/* EDITAR AULAS */
const modalEditar = document.getElementById('modalEditar');
const editarNome = document.getElementById('editarNome');
const editarContador = document.getElementById('editarContador');
const editarLista = document.getElementById('editarLista');
const editarVazio = document.getElementById('editarVazio');

const estadoEdicao = {
  aluno: null,
  editandoId: null,
};

const ICONE_LAPIS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>`;
const ICONE_LIXEIRA = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>`;

/* Dados */
async function aulasDoAluno() {
  return buscarAulas({ alunoId: estadoEdicao.aluno.id });
}

function fimDaAula(aula) {
  return aula.fim || paraHora(paraMinutos(aula.hora) + DURACAO_AULA);
}

function aulaJaPassou(aula) {
  const agora = new Date();
  const hoje = paraISO(agora);
  if (aula.data < hoje) return true;
  if (aula.data === hoje) {
    return paraMinutos(aula.hora) <= agora.getHours() * 60 + agora.getMinutes();
  }
  return false;
}

/* Abrir e fechar */
async function abrirEdicao(aluno) {
  estadoEdicao.aluno = aluno;
  estadoEdicao.editandoId = null;
  editarNome.textContent = aluno.nome;

  modalEditar.hidden = false;
  document.body.classList.add('sem-scroll');

  await renderEdicao();
}

function fecharEdicao() {
  modalEditar.hidden = true;
  document.body.classList.remove('sem-scroll');
  estadoEdicao.editandoId = null;
}

document.getElementById('fecharEditar').addEventListener('click', fecharEdicao);

modalEditar.addEventListener('click', (evento) => {
  if (evento.target === modalEditar) fecharEdicao();
});

document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape' && !modalEditar.hidden) fecharEdicao();
});

/* Desenhar a lista */
async function renderEdicao() {  
  let aulas;
  try {
    aulas = await aulasDoAluno();
  } catch (erro) {
    console.error(erro);
    mostrarToast('Erro ao carregar as aulas.', 'erro');
    return;
  }

  editarContador.textContent = textoAulas(aulas.length);
  estadoEdicao.aulas = aulas;
  document.getElementById('imprimirEdicao').hidden = aulas.length === 0;
  editarVazio.hidden = aulas.length > 0;
  editarLista.innerHTML = '';

  aulas.forEach((aula) => {
    const passou = aulaJaPassou(aula);

    const li = document.createElement('li');
    li.className = 'edit-item' + (passou ? ' passou' : '');

    const linha = document.createElement('div');
    linha.className = 'edit-item__linha';

    const texto = document.createElement('span');
    texto.textContent = `${dataBR(aula.data)} - (${aula.hora} → ${fimDaAula(aula)})`;
    linha.appendChild(texto);

    if (passou) {
      const tag = document.createElement('span');
      tag.className = 'edit-item__tag';
      tag.textContent = 'Realizada';
      linha.appendChild(tag);
    } else {
      const acoes = document.createElement('div');
      acoes.className = 'edit-item__acoes';
      acoes.innerHTML = `
        <button type="button" class="icone-btn" data-acao="editar" aria-label="Editar aula">${ICONE_LAPIS}</button>
        <button type="button" class="icone-btn perigo" data-acao="excluir" aria-label="Excluir aula">${ICONE_LIXEIRA}</button>
      `;

      acoes.querySelector('[data-acao="editar"]').addEventListener('click', () => {
        estadoEdicao.editandoId = estadoEdicao.editandoId === aula.id ? null : aula.id;
        renderEdicao();
      });

      acoes.querySelector('[data-acao="excluir"]').addEventListener('click', () => excluirAula(aula));

      linha.appendChild(acoes);
    }

    li.appendChild(linha);

    if (!passou && estadoEdicao.editandoId === aula.id) {
      li.appendChild(criarFormulario(aula));
    }

    editarLista.appendChild(li);
  });
}

/* Formulário de reagendamento */
function opcoesHora(selecionada) {
  let html = '';
  for (let h = ABERTURA / 60; h < FECHAMENTO / 60; h++) {
    html += `<option value="${pad(h)}"${pad(h) === selecionada ? ' selected' : ''}>${pad(h)}</option>`;
  }
  return html;
}

function opcoesMinuto(selecionado) {
  let html = '';
  for (let m = 0; m < 60; m += 5) {
    html += `<option value="${pad(m)}"${pad(m) === selecionado ? ' selected' : ''}>${pad(m)}</option>`;
  }
  return html;
}

function criarFormulario(aula) {
  const [h, m] = aula.hora.split(':');

  const form = document.createElement('div');
  form.className = 'edit-form';
  form.innerHTML = `
    <div>
      <label>Data</label>
      <input type="date" class="f-data" value="${aula.data}" min="${paraISO(new Date())}">
    </div>
    <div class="edit-form__hora">
      <div>
        <label>Hora</label>
        <select class="f-hora">${opcoesHora(h)}</select>
      </div>
      <span>:</span>
      <div>
        <label>Minutos</label>
        <select class="f-minuto">${opcoesMinuto(m)}</select>
      </div>
    </div>
    <div class="edit-form__botoes">
      <button type="button" class="btn-cancelar-edicao">Cancelar</button>
      <button type="button" class="btn-salvar-edicao">Salvar</button>
    </div>
  `;

  form.querySelector('.btn-cancelar-edicao').addEventListener('click', () => {
    estadoEdicao.editandoId = null;
    renderEdicao();
  });

  form.querySelector('.btn-salvar-edicao').addEventListener('click', () => {
    const data = form.querySelector('.f-data').value;
    const hora = `${form.querySelector('.f-hora').value}:${form.querySelector('.f-minuto').value}`;
    salvarEdicao(aula, data, hora);
  });

  return form;
}

/* Salvar reagendamento */
async function salvarEdicao(aula, data, hora) {
  if (!data) {
    mostrarToast('Escolha uma data.', 'erro');
    return;
  }

  const inicio = paraMinutos(hora);
  const fim = inicio + DURACAO_AULA;

  if (fim > FECHAMENTO) {
    mostrarToast(`A aula precisa terminar até as ${paraHora(FECHAMENTO)}.`, 'erro');
    return;
  }

  const agora = new Date();
  const agoraMin = agora.getHours() * 60 + agora.getMinutes();
  if (data < paraISO(agora) || (data === paraISO(agora) && inicio <= agoraMin)) {
    mostrarToast('Escolha uma data e horário que ainda não passaram.', 'erro');
    return;
  }

  try {
    const doDia = await buscarAulas({ data, alunoId: aula.alunoId });
    const conflito = doDia.find((outra) =>
      outra.id !== aula.id &&
      haSobreposicao(inicio, fim, paraMinutos(outra.hora), paraMinutos(outra.hora) + DURACAO_AULA)
    );

    if (conflito) {
      mostrarToast(`Este aluno já tem aula às ${conflito.hora} nesse dia.`, 'erro');
      return;
    }

    await atualizarAula(aula.id, { data, hora, fim: paraHora(fim) });
  } catch (erro) {
    if (erroDeConflito(erro)) {
      mostrarToast('Esse horário acabou de ser ocupado.', 'erro');
    } else {
      console.error(erro);
      mostrarToast('Não foi possível reagendar a aula.', 'erro');
    }
    return;
  }

  estadoEdicao.editandoId = null;
  await renderEdicao();
  mostrarToast('Aula reagendada com sucesso!');
}

async function excluirAula(aula) {
  if (!confirm(`Excluir a aula de ${dataBR(aula.data)} às ${aula.hora}?`)) return;

  try {
    await removerAula(aula.id);
  } catch (erro) {
    console.error(erro);
    mostrarToast('Não foi possível excluir a aula.', 'erro');
    return;
  }

  estadoEdicao.editandoId = null;
  await renderEdicao();
  mostrarToast('Aula excluída.');
}