document.addEventListener('DOMContentLoaded', function () {
    const entrarBtn = document.getElementById('Entrar');
    const criarContaBtn = document.getElementById('EntrarCriar');
    const enviarDadosBtn = document.getElementById('enviarDados');
    const voltarLoginBtn = document.getElementById('voltarLogin');

    const loginSection = document.getElementById('login');
    const criarContaSection = document.getElementById('criarConta');

    // Mostrar seção de criar conta
    criarContaBtn.addEventListener('click', () => {
        loginSection.style.visibility = 'hidden';
        criarContaSection.style.visibility = 'visible';
    });

    // Voltar para seção de login
    voltarLoginBtn.addEventListener('click', () => {
        criarContaSection.style.visibility = 'hidden';
        loginSection.style.visibility = 'visible';
    });

    const dropdownInput = document.getElementById('dropdownInput');
    const dropdownOptions = document.getElementById('dropdownOptions');

    // Exibir ou ocultar o dropdown de opções
    dropdownInput.addEventListener('click', () => {
        dropdownOptions.style.visibility = (dropdownOptions.style.visibility === 'visible') ? 'hidden' : 'visible';
    });

    // Selecionar a opção do dropdown
    window.selectOption = function (option) {
        dropdownInput.value = option;
        dropdownOptions.style.visibility = 'hidden';
    };

    // Enviar dados de criação de conta
    enviarDadosBtn.addEventListener('click', async () => {
        const nome = document.getElementById('inputName').value.trim();
        const senha = document.getElementById('inputPassword').value.trim();
        const email = document.getElementById('inputEmail').value.trim();
        const classe = document.getElementById('dropdownInput').value.trim();

        // Verificar se todos os campos foram preenchidos
        if (!nome || !senha || !email || !classe) {
            alert('Preencha todos os campos!');
            return;
        }

        try {
            // Verificar se o usuário ou e-mail já existem
            const usersResponse = await fetch('/usuarios');
            const existingUsers = await usersResponse.json();

            const userExists = existingUsers.some(user => user.nome === nome || user.email === email);

            if (userExists) {
                alert('Usuário ou e-mail já cadastrado!');
                return;
            }

            const userData = { nome, senha, email, classe };

            // Enviar dados para registrar o novo usuário
            const response = await fetch('/registrar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            if (result.success) {
                alert('Conta criada com sucesso!');
                criarContaSection.style.visibility = 'hidden';
                loginSection.style.visibility = 'visible';
            } else {
                alert(result.message || 'Erro ao criar conta.');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro na conexão com o servidor.');
        }
    });

    // Enviar dados de login
    entrarBtn.addEventListener('click', async () => {
        const nome = document.getElementById('loginName').value.trim();
        const senha = document.getElementById('loginPassword').value.trim();

        // Verificar se os campos de nome e senha estão preenchidos
        if (!nome || !senha) {
            alert('Preencha todos os campos!');
            return;
        }

        try {
            // Buscar usuários do servidor
            const response = await fetch('/usuarios');
            const users = await response.json();

            // Verificar se o nome e senha correspondem a um usuário
            const user = users.find(user => user.nome === nome && user.senha === senha);

            if (user) {
                // Enviar requisição para o servidor para autenticar o usuário
                await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome: user.nome, classe: user.classe })
                });

                // Armazenar dados do usuário logado no localStorage
                localStorage.setItem('loggedInUser', JSON.stringify(user));
                localStorage.setItem('nomePlayer', user.nome);

                // Redirecionar para a página do jogo
                window.location.href = '/pagina1.html';
            } else {
                alert('Usuário ou senha incorretos!');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro na conexão com o servidor.');
        }
    });
});
