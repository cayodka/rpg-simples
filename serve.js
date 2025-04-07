const http = require("http");
const fs = require("fs");
const path = require("path");

const porta = 8080;
const arquivoUsuarios = path.join(__dirname, "users.json");

let usuariosOnline = [];

function servirArquivoEstatico(caminhoArquivo, resposta) {
  fs.readFile(caminhoArquivo, (erro, dados) => {
    if (erro) {
      resposta.writeHead(404, { "Content-Type": "text/plain" });
      resposta.end("Arquivo não encontrado");
    } else {
      const extensao = path.extname(caminhoArquivo);
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
}

function salvarUsuario(dados) {
  let usuarios = [];
  if (fs.existsSync(arquivoUsuarios)) {
    usuarios = JSON.parse(fs.readFileSync(arquivoUsuarios, "utf8"));
  }
  usuarios.push(dados);
  fs.writeFileSync(arquivoUsuarios, JSON.stringify(usuarios, null, 2));
}

function obterUsuarios() {
  if (fs.existsSync(arquivoUsuarios)) {
    return JSON.parse(fs.readFileSync(arquivoUsuarios, "utf8"));
  }
  return [];
}

const servidor = http.createServer((requisicao, resposta) => {
  const { url, method } = requisicao;

  if (method === "POST" && url === "/registrar") {
    let corpo = "";
    requisicao.on("data", pedaço => {
      corpo += pedaço.toString();
    });
    requisicao.on("end", () => {
      const dadosUsuario = JSON.parse(corpo);
      salvarUsuario(dadosUsuario);
      resposta.writeHead(200, { "Content-Type": "application/json" });
      resposta.end(JSON.stringify({ success: true }));
    });
    return;
  }

  if (method === "POST" && url === "/login") {
    let corpo = "";
    requisicao.on("data", pedaço => {
      corpo += pedaço.toString();
    });
    requisicao.on("end", () => {
      const { nome, classe } = JSON.parse(corpo);

      const jaOnline = usuariosOnline.some(
        (usuario) => usuario.nome === nome && usuario.classe === classe
      );

      if (!jaOnline) {
        usuariosOnline.push({ nome, classe });
      }

      resposta.writeHead(200, { "Content-Type": "application/json" });
      resposta.end(JSON.stringify({ success: true }));
    });
    return;
  }

  if (method === "GET" && url === "/usuarios-online") {
    resposta.writeHead(200, { "Content-Type": "application/json" });
    resposta.end(JSON.stringify(usuariosOnline));
    return;
  }

  if (method === "GET" && url === "/usuarios") {
    const usuarios = obterUsuarios();
    resposta.writeHead(200, { "Content-Type": "application/json" });
    resposta.end(JSON.stringify(usuarios));
    return;
  }

  const caminhoArquivo = path.join(__dirname, url === "/" ? "index.html" : url);
  servirArquivoEstatico(caminhoArquivo, resposta);
});

servidor.listen(porta, () => {
  console.log("Servidor rodando em: http://localhost:" + porta);
});
