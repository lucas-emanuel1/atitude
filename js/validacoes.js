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