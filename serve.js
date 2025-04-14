const http = require("http");
const fs = require("fs");
const path = require("path");

const porta = 8080;
const arquivoUsuarios = path.join(__dirname, "users.json");

let usuariosOnline = [];

function servirArquivoEstatico(caminhoArquivo, resposta) {
  fs.access(caminhoArquivo, fs.constants.F_OK, (err) => {
    if (err) {
      resposta.writeHead(404, { "Content-Type": "text/plain" });
      resposta.end("Arquivo não encontrado");
      return;
    }

    fs.readFile(caminhoArquivo, (erro, dados) => {
      if (erro) {
        resposta.writeHead(500, { "Content-Type": "text/plain" });
        resposta.end("Erro interno ao ler o arquivo");
      } else {
        const extensao = path.extname(caminhoArquivo).toLowerCase();
        const tipoConteudo = {
          ".html": "text/html",
          ".css": "text/css",
          ".js": "text/javascript",
          ".json": "application/json",
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".gif": "image/gif",
        }[extensao] || "text/plain";

        resposta.writeHead(200, { "Content-Type": tipoConteudo });
        resposta.end(dados);
      }
    });
  });
}

function salvarUsuario(dados) {
  let usuarios = obterUsuarios();
  usuarios.push(dados);
  fs.writeFileSync(arquivoUsuarios, JSON.stringify(usuarios, null, 2));
}

function obterUsuarios() {
  try {
    if (fs.existsSync(arquivoUsuarios)) {
      const data = fs.readFileSync(arquivoUsuarios, "utf8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Erro ao ler usuários:", err);
  }
  return [];
}

const servidor = http.createServer((req, res) => {
  const { url, method } = req;

  if (method === "POST" && url === "/registrar") {
    let corpo = "";
    req.on("data", chunk => corpo += chunk);
    req.on("end", () => {
      try {
        const dadosUsuario = JSON.parse(corpo);
        salvarUsuario(dadosUsuario);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: "Dados inválidos" }));
      }
    });
    return;
  }

  if (method === "POST" && url === "/login") {
    let corpo = "";
    req.on("data", chunk => corpo += chunk);
    req.on("end", () => {
      try {
        const { nome, classe } = JSON.parse(corpo);

        const jaOnline = usuariosOnline.some(
          usuario => usuario.nome === nome && usuario.classe === classe
        );

        if (!jaOnline) {
          usuariosOnline.push({ nome, classe });
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: "Dados inválidos" }));
      }
    });
    return;
  }

  if (method === "PUT" && url === "/alterar-nome") {
    let corpo = "";
    req.on("data", chunk => corpo += chunk);
    req.on("end", () => {
      try {
        const { nomeAntigo, novoNome } = JSON.parse(corpo);

        let usuarios = obterUsuarios();
        const indiceUsuario = usuarios.findIndex(u => u.nome === nomeAntigo);

        if (indiceUsuario === -1) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, message: "Usuário não encontrado." }));
          return;
        }

        usuarios[indiceUsuario].nome = novoNome;
        fs.writeFileSync(arquivoUsuarios, JSON.stringify(usuarios, null, 2));

        const indiceOnline = usuariosOnline.findIndex(u => u.nome === nomeAntigo);
        if (indiceOnline !== -1) {
          usuariosOnline[indiceOnline].nome = novoNome;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: "Dados inválidos" }));
      }
    });
    return;
  }

  if (method === "DELETE" && url === "/excluir-conta") {
    let corpo = "";
    req.on("data", chunk => corpo += chunk);
    req.on("end", () => {
      try {
        const { nome } = JSON.parse(corpo);
        let usuarios = obterUsuarios();
        usuarios = usuarios.filter(u => u.nome !== nome);
        fs.writeFileSync(arquivoUsuarios, JSON.stringify(usuarios, null, 2));
        usuariosOnline = usuariosOnline.filter(u => u.nome !== nome);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, message: "Conta excluída com sucesso." }));
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: "Dados inválidos" }));
      }
    });
    return;
  }

  if (method === "GET" && url === "/usuarios-online") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(usuariosOnline));
    return;
  }

  if (method === "GET" && url === "/usuarios") {
    const usuarios = obterUsuarios();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(usuarios));
    return;
  }

  const caminhoArquivo = path.join(__dirname, url === "/" ? "index.html" : url);
  servirArquivoEstatico(caminhoArquivo, res);
});

servidor.listen(porta, () => {
  console.log(`Servidor rodando em: http://localhost:${porta}`);
});
