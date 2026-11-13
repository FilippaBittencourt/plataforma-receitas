# API do Mums!

Backend do Mums!, feito com **Java 21**, **Spring Boot 4.1** e **PostgreSQL 16**.

## Como rodar

Pré-requisitos: Java 21 e Docker Desktop aberto. Não precisa instalar Maven nem PostgreSQL.

```bash
cd backend
./mvnw spring-boot:run
```

Na primeira execução, o Spring Boot:

1. sobe o PostgreSQL pelo `compose.yaml` (porta **5433** no seu computador);
2. cria as tabelas com as migrations do Flyway (`src/main/resources/db/migration`);
3. cadastra dados de demonstração.

A API fica em `http://localhost:8080`.

### Assistente de receitas

O botão flutuante de assistência usa a API da Groq com o modelo `qwen/qwen3.8-27b`. Para ativá-lo localmente, obtenha uma chave na Groq e inicie o backend com `GROQ_API_KEY=sua-chave ./mvnw spring-boot:run`. Em implantação Docker, coloque `GROQ_API_KEY` no `.env` antes de subir o Compose. A chave fica somente no backend; nunca a coloque em uma variável `VITE_*`.

O assistente exige login e limita cada conta a 12 perguntas por minuto. Sem chave, o restante da plataforma continua funcionando e o assistente informa que não está configurado.

**Contas de demonstração** (senha `demo1234`):

| E-mail | Papel |
|---|---|
| `julia@cookie.com` | usuária |
| `marina@cookie.com` | autora das receitas de exemplo |
| `moderacao@cookie.com` | moderação (ADMINISTRADOR) |

Para abrir o banco num cliente (DBeaver, pgAdmin): host `localhost`, porta `5433`, banco, usuário e senha `cookie`.

## Testes

```bash
./mvnw test
```

Os testes usam um PostgreSQL descartável com Testcontainers. Deixe o Docker aberto para executá-los. Eles cobrem cadastro, publicação, curadoria, avaliações, comentários, uploads e exclusão de conta.

## Banco de dados

As mudanças no banco ficam nas [migrations do Flyway](src/main/resources/db/migration). A estrutura inicial está em [`V1__estrutura_inicial.sql`](src/main/resources/db/migration/V1__estrutura_inicial.sql).

Tabelas: `categoria`, `usuario`, `receita`, `ingrediente`, `utiliza`, `passo_preparo`, `avalia`, `comenta` e `denuncia`, mais a view `receita_estatistica`, que calcula as médias, a taxa de sucesso e o selo.

**Receita Verificada:** avaliações de pelo menos 10 pessoas diferentes, média geral ≥ 4,0 e sucesso em pelo menos 80% das avaliações.

Nunca edite uma migration que já rodou. Para mudar o banco, crie um arquivo novo com a próxima versão disponível.

## Autenticação

`POST /api/auth/login` devolve um `token` (JWT, válido por 7 dias). Nas rotas protegidas, envie o cabeçalho:

```
Authorization: Bearer <token>
```

Senhas são guardadas com BCrypt. Em produção, defina a variável `JWT_SECRET` (mínimo de 32 caracteres) e os dados do banco (`SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`).

### Recuperação de senha

Não depende de e-mail. No cadastro, a pessoa recebe um código de recuperação que deve guardar. Contas antigas recebem o código no próximo login após a migração. O código é armazenado somente como hash, pode ser usado uma vez e é substituído por outro após redefinir a senha. Se a pessoa ainda estiver conectada e perder o código, pode gerar outro em Configurações.

O mesmo SMTP envia avisos de novas avaliações e comentários às pessoas autoras, conforme suas preferências. Falhas de envio ficam registradas no log e não desfazem comentários ou avaliações.

### Implantação com arquivos persistentes

O perfil de implantação inclui um volume Docker nomeado para os uploads e outro para o banco. Na pasta `backend`, copie `.env.example` para `.env`, preencha os segredos e as origens públicas e rode:

```bash
docker compose -f compose.deploy.yaml up -d --build
```

O volume `uploads-dados` mantém as fotos entre recriações dos containers. Em execução local com `./mvnw spring-boot:run`, `UPLOADS_DIR` pode apontar para um diretório durável no host; o padrão é `backend/uploads`.

### HTTPS em produção

O Compose inclui um proxy Caddy opcional com certificado TLS automático. Aponte o DNS do domínio da API para o servidor, configure `API_DOMAIN` em `.env` e suba com `docker compose -f compose.deploy.yaml --profile https up -d --build`. Libere as portas 80 e 443 no firewall. Para não expor a API em HTTP público, mantenha `API_PORT` acessível somente no host/local (ou remova o mapeamento de portas do serviço `api`); o Caddy encaminha internamente para a API. O HTTPS do site frontend deve ser configurado também no provedor que hospeda o frontend.

Nunca versione o `.env` preenchido nem credenciais SMTP.

## Endpoints

Legenda: 🔓 público · 🔑 precisa de login · 🛡️ só moderação.

**Conta**

| | Método e rota | O que faz |
|---|---|---|
| 🔓 | `POST /api/auth/cadastro` | Cria a conta e já devolve o token. `nomeUsuario` é opcional (gerado a partir do nome). |
| 🔓 | `POST /api/auth/login` | Entra com e-mail e senha. |
| 🔓 | `POST /api/auth/redefinir-senha` | Troca a senha com e-mail e código de recuperação de uso único; retorna um novo código. |
| 🔑 | `GET /api/me` | Perfil completo da pessoa logada. |
| 🔑 | `PATCH /api/me` | Atualiza nome, nome de usuário, bio e foto. |
| 🔑 | `PUT /api/me/email` | Troca o e-mail. |
| 🔑 | `PUT /api/me/senha` | Troca a senha (pede a atual). |
| 🔑 | `PUT /api/me/notificacoes` | Preferências de notificação. |
| 🔑 | `POST /api/me/codigo-recuperacao` | Gera um código novo e invalida o anterior. |
| 🔑 | `DELETE /api/me` | Exclui a conta. As receitas continuam no site, sem autor. |
| 🔑 | `GET /api/me/receitas` | Minhas receitas, inclusive pendentes e recusadas. |
| 🔑 | `GET /api/me/avaliacoes` | Minhas avaliações. |
| 🔓 | `GET /api/usuarios/{nomeUsuario}` | Perfil público. |
| 🔓 | `GET /api/usuarios/{nomeUsuario}/receitas` | Receitas aprovadas da pessoa. |

**Receitas**

| | Método e rota | O que faz |
|---|---|---|
| 🔓 | `GET /api/categorias` | Categorias com o total de receitas aprovadas. |
| 🔓 | `GET /api/receitas` | Busca. Parâmetros: `q`, `categoria`, `ingrediente`, `origem`, `verificadas`, `ordem` (`recentes`, `melhores`, `mais-testadas`), `pagina`, `tamanho`. |
| 🔓 | `GET /api/receitas/ranking` | Ranking (`categoria`, `limite`). |
| 🔓 | `GET /api/receitas/{id}` | Detalhe com ingredientes, passos e médias por critério. |
| 🔑 | `POST /api/receitas` | Publica uma receita própria imediatamente. |
| 🔑 | `POST /api/receitas/indicacoes` | Envia uma receita externa com link para a curadoria. |
| 🔑 | `PUT /api/receitas/{id}` | Edita uma receita própria; a versão atualizada é publicada imediatamente. |
| 🔑 | `DELETE /api/receitas/{id}` | Exclui (autor ou moderação). |
| 🔑 | `POST /api/assistente/receitas` | Pergunta ao assistente culinário; aceita contexto da receita aberta e histórico curto da conversa. |
| 🔑 | `POST /api/receitas/{id}/avaliacao` | Registra uma avaliação; cada envio é uma nova experiência. Aceita `comentario` e `fotoResultado` opcionais. |
| 🔑 | `GET /api/receitas/{id}/avaliacao` | Minha avaliação mais recente desta receita. |
| 🔓 | `GET /api/receitas/{id}/avaliacoes` | Lista as avaliações registradas para a receita. |
| 🔓 | `GET /api/receitas/{id}/comentarios` | Comentários visíveis, do mais novo ao mais antigo. |
| 🔓 | `GET /api/receitas/{id}/fotos` | Fotos dos comentários e avaliações, paginadas do mais novo ao mais antigo. |
| 🔑 | `POST /api/receitas/{id}/comentarios` | Comenta (com foto opcional). |
| 🔑 | `DELETE /api/comentarios/{id}` | Exclui (autor ou moderação). |
| 🔑 | `POST /api/uploads` | Envia uma foto (`multipart`, campo `arquivo`, PNG/JPG/WEBP até 5 MB). Devolve a `url`. |
| 🔑 | `POST /api/denuncias` | Denuncia um usuário (`nomeUsuario`) ou um comentário (`idComentario`). |

**Moderação** 🛡️

| Método e rota | O que faz |
|---|---|
| `GET /api/moderacao/resumo` | Números do painel. |
| `GET /api/moderacao/receitas` | Fila de curadoria. |
| `POST /api/moderacao/receitas/{id}/aprovar` · `/recusar` | Decide uma receita. |
| `POST /api/moderacao/comentarios/{id}/ocultar` · `/restaurar` | Esconde ou devolve um comentário. |
| `GET /api/moderacao/denuncias` | Denúncias abertas. |
| `POST /api/moderacao/denuncias/{id}/resolver` | Marca a denúncia como resolvida. |
| `GET /api/moderacao/usuarios` | Usuários com denúncias abertas. |
| `GET /api/moderacao/usuarios/gestao?q=` | Lista usuários para gestão, com busca por nome, nome de usuário ou e-mail. |
| `POST /api/moderacao/usuarios/{id}/suspender` · `/reativar` | Suspende ou reativa. Conta suspensa não entra nem publica. |

Erros seguem o formato *Problem Details*. Em erros de validação, o campo `campos` traz a mensagem de cada campo, pronta para mostrar no formulário:

```json
{ "status": 400, "detail": "Revise os campos destacados.", "campos": { "senha": "A senha precisa ter de 8 a 72 caracteres." } }
```
## Rascunhos de receitas

Rascunhos são privados por conta e persistidos em `rascunho_receita` (migração Flyway V4). A API autenticada oferece:

- `GET /api/rascunhos` — lista os rascunhos do usuário autenticado;
- `POST /api/rascunhos` com `{ "conteudo": { ... } }` — cria um rascunho;
- `GET /api/rascunhos/{id}` e `PUT /api/rascunhos/{id}` — consulta ou atualiza um rascunho próprio;
- `DELETE /api/rascunhos/{id}` — exclui um rascunho próprio.

O conteúdo é salvo como JSON e pode estar incompleto. A validação normal de receita continua sendo aplicada quando a pessoa publica; publicação e curadoria usam os endpoints de receitas existentes.
