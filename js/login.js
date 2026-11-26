const form = document.getElementById('formLogin');
const toast = document.getElementById('toast');

function mostrarToast(mensagem) {
  toast.textContent = mensagem;
  toast.style.background = '#d93025';
  toast.classList.add('visivel');
  setTimeout(() => toast.classList.remove('visivel'), 2800);
}

// Se já estiver logado, vai direto para o início
db.auth.getSession().then(({ data }) => {
  if (data.session) location.replace('index.html');
});

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const botao = form.querySelector('button[type="submit"]');
  botao.disabled = true;
  botao.textContent = 'Entrando...';

  const { error } = await db.auth.signInWithPassword({
    email: form.email.value.trim(),
    password: form.senha.value,
  });

  if (error) {
    mostrarToast('E-mail ou senha incorretos.');
    botao.disabled = false;
    botao.textContent = 'Entrar';
    return;
  }

  location.replace('index.html');
});