exigirLogin().then((logado) => {
  if (logado) carregar();
});

/* ELEMENTOS */
const toast = document.getElementById('toast');
const periodoTexto = document.getElementById('periodoTexto');
const dataEscolhida = document.getElementById('dataEscolhida');
const totalAulasEl = document.getElementById('totalAulas');
const totalAlunosEl = document.getElementById('totalAlunos');
const picoEl = document.getElementById('pico');
const graficoEl = document.getElementById('grafico');
const filtro = document.getElementById('filtro');
const listaEl = document.getElementById('lista');

/* CONSTANTES */
const NOMES_DIA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
  'quinta-feira', 'sexta-feira', 'sábado'];
const ABREV_DIA = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

/* AUXILIARES */
function pad(n) {
  return String(n).padStart(2, '0');
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

function paraMinutos(hora) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

function somarDias(iso, n) {
  const d = lerISO(iso);
  d.setDate(d.getDate() + n);
  return paraISO(d);
}

function normalizar(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function textoAulas(qtd) {
  return `${qtd} ${qtd === 1 ? 'aula' : 'aulas'}`;
}

function maiuscula(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function el(tag, classe, texto) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

function mostrarToast(mensagem) {
  toast.textContent = mensagem;
  toast.style.background = '#d93025';
  toast.classList.add('visivel');
  setTimeout(() => toast.classList.remove('visivel'), 2800);
}

/* ESTADO */
const estado = {
  modo: 'semana',
  data: paraISO(new Date()),
  filtro: '',
  aulas: [],
};

let pedido = 0;

/* Período exibido: segunda a domingo (semana) ou um único dia */
function intervalo() {
  if (estado.modo === 'dia') {
    return { inicio: estado.data, fim: estado.data };
  }
  const d = lerISO(estado.data);
  const deslocamento = (d.getDay() + 6) % 7;      // semana começa na segunda
  const inicio = paraISO(new Date(d.getFullYear(), d.getMonth(), d.getDate() - deslocamento));
  return { inicio, fim: somarDias(inicio, 6) };
}

/* CARREGAR DO BANCO */
async function carregar() {
  const meu = ++pedido;
  const { inicio, fim } = intervalo();

  listaEl.innerHTML = '<p class="vazio">Carregando...</p>';

  try {
    const aulas = await buscarAulasPeriodo(inicio, fim);
    if (meu !== pedido) return;
    estado.aulas = aulas;
  } catch (erro) {
    console.error(erro);
    if (meu !== pedido) return;
    listaEl.innerHTML = '<p class="vazio">Não foi possível carregar as aulas.</p>';
    mostrarToast('Erro ao carregar as aulas.');
    return;
  }

  desenhar();
}

/* CÁLCULOS */
/* Junta aulas seguidas do mesmo aluno: 15:30-16:20 + 16:20-17:10 -> 15:30 → 17:10 */
function montarBlocos(aulas) {
  const blocos = [];

  aulas.forEach((aula) => {
    const anterior = blocos.find((b) =>
      b.alunoId === aula.alunoId && b.data === aula.data && b.fim === aula.hora
    );

    if (anterior) {
      anterior.fim = aula.fim;
      anterior.qtd++;
    } else {
      blocos.push({
        alunoId: aula.alunoId,
        nome: aula.alunoNome,
        data: aula.data,
        hora: aula.hora,
        fim: aula.fim,
        qtd: 1,
      });
    }
  });

  return blocos;
}

/* Máximo de alunos com aula ao mesmo tempo */
function picoSimultaneo(aulas) {
  let maximo = 0;

  aulas.forEach((aula) => {
    const t = paraMinutos(aula.hora);
    const n = aulas.filter((b) =>
      b.data === aula.data && paraMinutos(b.hora) <= t && t < paraMinutos(b.fim)
    ).length;
    if (n > maximo) maximo = n;
  });

  return maximo;
}

/* DESENHAR */
function desenhar() {
  const { inicio, fim } = intervalo();
  const hojeISO = paraISO(new Date());
  const termo = normalizar(estado.filtro);

  const aulas = estado.aulas.filter((a) => !termo || normalizar(a.alunoNome).includes(termo));

  // Título do período
  periodoTexto.textContent = estado.modo === 'dia'
    ? `${maiuscula(NOMES_DIA[lerISO(inicio).getDay()])}, ${dataBR(inicio)}`
    : `${dataBR(inicio).slice(0, 5)} a ${dataBR(fim)}`;
  dataEscolhida.value = estado.data;

  // Números do topo
  totalAulasEl.textContent = aulas.length;
  totalAlunosEl.textContent = new Set(aulas.map((a) => a.alunoId)).size;
  picoEl.textContent = picoSimultaneo(aulas);

  // Lista de dias do período
  const dias = [];
  for (let iso = inicio; iso <= fim; iso = somarDias(iso, 1)) dias.push(iso);

  // Gráfico (só na semana)
  graficoEl.hidden = estado.modo !== 'semana';
  if (estado.modo === 'semana') {
    const contagens = dias.map((iso) => aulas.filter((a) => a.data === iso).length);
    const maximo = Math.max(1, ...contagens);

    graficoEl.innerHTML = '';
    dias.forEach((iso, i) => {
      const col = el('div', 'grafico__col' + (iso === hojeISO ? ' hoje' : ''));
      const barra = el('div', 'grafico__barra');
      barra.style.height = `${(contagens[i] / maximo) * 80}%`;
      col.append(
        el('small', '', contagens[i]),
        barra,
        el('span', '', ABREV_DIA[lerISO(iso).getDay()])
      );
      graficoEl.appendChild(col);
    });
  }

  // Blocos de cada dia
  listaEl.innerHTML = '';

  dias.forEach((iso) => {
    const doDia = aulas.filter((a) => a.data === iso);
    const blocos = montarBlocos(doDia);

    const secao = el('section', 'dia-bloco' + (iso === hojeISO ? ' hoje' : ''));

    const cab = el('div', 'dia-bloco__cab');
    cab.append(
      el('strong', '', `${maiuscula(NOMES_DIA[lerISO(iso).getDay()])} · ${dataBR(iso).slice(0, 5)}`),
      el('span', 'dia-bloco__qtd', textoAulas(doDia.length))
    );
    secao.appendChild(cab);

    if (blocos.length === 0) {
      secao.appendChild(el('p', 'vazio-dia', 'Sem aulas'));
    } else {
      const ul = document.createElement('ul');
      blocos.forEach((b) => {
        const li = document.createElement('li');
        li.append(
          el('span', 'hora', `${b.hora} → ${b.fim}`),
          el('span', 'nome', b.nome),
          el('span', 'qtd', textoAulas(b.qtd))
        );
        ul.appendChild(li);
      });
      secao.appendChild(ul);
    }

    listaEl.appendChild(secao);
  });
}

/* EVENTOS */
document.querySelectorAll('.aba').forEach((aba) => {
  aba.addEventListener('click', () => {
    document.querySelectorAll('.aba').forEach((a) => a.classList.remove('ativa'));
    aba.classList.add('ativa');
    estado.modo = aba.dataset.modo;
    carregar();
  });
});

document.getElementById('anterior').addEventListener('click', () => {
  estado.data = somarDias(estado.data, estado.modo === 'semana' ? -7 : -1);
  carregar();
});

document.getElementById('proximo').addEventListener('click', () => {
  estado.data = somarDias(estado.data, estado.modo === 'semana' ? 7 : 1);
  carregar();
});

document.getElementById('hoje').addEventListener('click', () => {
  estado.data = paraISO(new Date());
  carregar();
});

dataEscolhida.addEventListener('change', () => {
  if (!dataEscolhida.value) return;
  estado.data = dataEscolhida.value;
  carregar();
});

filtro.addEventListener('input', () => {
  estado.filtro = filtro.value;
  desenhar();
});