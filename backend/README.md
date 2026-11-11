# Cookie: API

Backend da plataforma de receitas, em **Spring Boot 4.1 (Java 21)** com **PostgreSQL 16**.

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

Os testes sobem um PostgreSQL descartável com Testcontainers (é preciso ter o Docker aberto) e passam pelos fluxos completos: cadastro, curadoria, avaliação, selo de verificada, moderação, exclusão de conta e upload.

## Banco de dados

O script fica em [`V1__estrutura_inicial.sql`](src/main/resources/db/migration/V1__estrutura_inicial.sql). Ele é a versão revisada do script original, e cada mudança está marcada com `MUDANÇA:` e o motivo.

Tabelas: `categoria`, `usuario`, `receita`, `ingrediente`, `utiliza`, `passo_preparo`, `avalia`, `comenta` e `denuncia`, mais a view `receita_estatistica`, que calcula as médias, a taxa de sucesso e o selo.

**Receita Verificada:** pelo menos 10 avaliações, média geral ≥ 4,0 e ≥ 80% das pessoas dizendo que a receita funcionou.

Nunca edite uma migration que já rodou. Para mudar o banco, crie um arquivo novo com a próxima versão disponível (atualmente `V7__descricao.sql`).

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
| 🔑 | `POST /api/receitas` | Publica uma receita. Ela entra como `PENDENTE` até a curadoria aprovar. |
| 🔑 | `POST /api/receitas/indicacoes` | Indica uma receita externa por link. |
| 🔑 | `PUT /api/receitas/{id}` | Edita (só o autor). A receita volta para a curadoria. |
| 🔑 | `DELETE /api/receitas/{id}` | Exclui (autor ou moderação). |
| 🔑 | `PUT /api/receitas/{id}/avaliacao` | Avalia ou reavalia: uma avaliação por pessoa. Aceita `comentario` e `fotoResultado` opcionais. |
| 🔑 | `GET /api/receitas/{id}/avaliacao` | Minha avaliação desta receita. |
| 🔑 | `DELETE /api/receitas/{id}/avaliacao` | Remove minha avaliação. |
| 🔓 | `GET /api/receitas/{id}/comentarios` | Comentários visíveis, do mais novo ao mais antigo. |
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
