const form = document.getElementById('formAluno');
const toast = document.getElementById('toast');

exigirLogin();

/* MÁSCARAS */
function somenteNumeros(valor) {
  return valor.replace(/\D/g, '');
}

function mascaraData(valor) {
  const n = somenteNumeros(valor).slice(0, 8);
  if (n.length > 4) return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}`;
  if (n.length > 2) return `${n.slice(0, 2)}/${n.slice(2)}`;
  return n;
}

function mascaraCPF(valor) {
  const n = somenteNumeros(valor).slice(0, 11);
  if (n.length > 9) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`;
  if (n.length > 6) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`;
  if (n.length > 3) return `${n.slice(0, 3)}.${n.slice(3)}`;
  return n;
}

function mascaraTelefone(valor) {
  const n = somenteNumeros(valor).slice(0, 11);
  if (n.length > 7) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
  if (n.length > 2) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  if (n.length > 0) return `(${n}`;
  return n;
}

function aplicarMascara(id, funcao) {
  const input = document.getElementById(id);
  input.addEventListener('input', () => {
    input.value = funcao(input.value);
  });
}

aplicarMascara('nascimento', mascaraData);
aplicarMascara('cpf', mascaraCPF);
aplicarMascara('telefone', mascaraTelefone);

/* VALIDAÇÕES */
function validarData(texto) {
  const partes = texto.split('/');
  if (partes.length !== 3 || texto.length !== 10) return false;

  const dia = Number(partes[0]);
  const mes = Number(partes[1]);
  const ano = Number(partes[2]);
  const data = new Date(ano, mes - 1, dia);

  const existe =
    data.getFullYear() === ano &&
    data.getMonth() === mes - 1 &&
    data.getDate() === dia;

  return existe && ano >= 1900 && data <= new Date();
}

function validarCPF(texto) {
  const cpf = somenteNumeros(texto);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  for (let tamanho = 9; tamanho <= 10; tamanho++) {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) {
      soma += Number(cpf[i]) * (tamanho + 1 - i);
    }
    const digito = ((soma * 10) % 11) % 10;
    if (digito !== Number(cpf[tamanho])) return false;
  }
  return true;
}

function validarEmail(texto) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto);
}

function validarTelefone(texto) {
  const n = somenteNumeros(texto);
  return n.length === 10 || n.length === 11;
}

/* MENSAGENS DE ERRO */
function mostrarErro(campo, mensagem) {
  const span = document.querySelector(`[data-erro="${campo}"]`);
  const wrapper = span.closest('.campo');
  span.textContent = mensagem;
  wrapper.classList.toggle('invalido', Boolean(mensagem));
}

function limparErros() {
  document.querySelectorAll('[data-erro]').forEach((span) => {
    span.textContent = '';
    span.closest('.campo').classList.remove('invalido');
  });
}

/* TOAST */
function mostrarToast(mensagem, erro = false) {
  toast.textContent = mensagem;
  toast.style.background = erro ? '#d93025' : '#2e7d32';
  toast.classList.add('visivel');
  setTimeout(() => toast.classList.remove('visivel'), 2800);
}

/* ENVIO DO FORMULÁRIO */
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
    mostrarToast('Confira os campos destacados.', true);
    return;
  }

  const botao = form.querySelector('button[type="submit"]');
  botao.disabled = true;
  botao.textContent = 'Salvando...';

  try {
    await criarAluno(dados);
    form.reset();
    mostrarToast('Aluno cadastrado com sucesso!');
  } catch (erro) {
    if (erro.code === '23505') {
      mostrarErro('cpf', 'Já existe um aluno com este CPF.');
      mostrarToast('CPF já cadastrado.', true);
    } else {
      console.error(erro);
      mostrarToast('Não foi possível salvar. Tente novamente.', true);
    }
  } finally {
    botao.disabled = false;
    botao.textContent = 'Cadastrar';
  }
});