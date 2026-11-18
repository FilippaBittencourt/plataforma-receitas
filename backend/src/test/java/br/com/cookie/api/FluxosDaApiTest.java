package br.com.cookie.api;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;
import static org.hamcrest.Matchers.startsWith;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;

import com.jayway.jsonpath.JsonPath;

class FluxosDaApiTest extends ApiTestBase {

    @Test
    void contaCompletaLoginPerfilCredenciaisERecuperacaoDeSenha() throws Exception {
        String email = emailUnico("conta-completa");
        var cadastroResponse = mvc.perform(json(post("/api/auth/cadastro"), """
                {"nome": "Ana Cozinha", "email": "%s", "senha": "senha-forte-123"}
                """.formatted(email)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.codigoRecuperacao").isNotEmpty())
                .andReturn().getResponse();
        String cadastro = cadastroResponse.getContentAsString();
        String token = tokenDoCookie(cadastroResponse.getHeader("Set-Cookie"));
        String codigo = JsonPath.read(cadastro, "$.codigoRecuperacao");

        mvc.perform(comToken(json(patch("/api/me"), """
                {"nome": "Ana Atualizada", "nomeUsuario": "@ana_cozinha", "bio": "Testando receitas", "fotoPerfil": null}
                """), token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Ana Atualizada"))
                .andExpect(jsonPath("$.nomeUsuario").value("ana_cozinha"))
                .andExpect(jsonPath("$.bio").value("Testando receitas"));
        String novoEmail = emailUnico("conta-alterada");
        mvc.perform(comToken(json(put("/api/me/email"), """
                {"email": "%s"}
                """.formatted(novoEmail)), token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(novoEmail));
        var senhaResponse = mvc.perform(comToken(json(put("/api/me/senha"), """
                {"senhaAtual": "senha-forte-123", "novaSenha": "senha-nova-456"}
                """), token))
                .andExpect(status().isOk())
                .andReturn().getResponse();
        String tokenRenovado = tokenDoCookie(senhaResponse.getHeader("Set-Cookie"));
        mvc.perform(comToken(get("/api/me"), token)).andExpect(status().isUnauthorized());
        mvc.perform(comToken(get("/api/me"), tokenRenovado)).andExpect(status().isOk());
        mvc.perform(json(post("/api/auth/login"), """
                {"email": "%s", "senha": "senha-forte-123"}
                """.formatted(novoEmail)))
                .andExpect(status().isUnauthorized());
        mvc.perform(json(post("/api/auth/login"), """
                {"email": "%s", "senha": "senha-nova-456"}
                """.formatted(novoEmail)))
                .andExpect(status().isOk());

        mvc.perform(json(post("/api/auth/redefinir-senha"), """
                {"email": "%s", "codigoRecuperacao": "%s", "novaSenha": "senha-recuperada-789"}
                """.formatted(novoEmail, codigo)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.codigoRecuperacao").isNotEmpty());
        mvc.perform(json(post("/api/auth/login"), """
                {"email": "%s", "senha": "senha-recuperada-789"}
                """.formatted(novoEmail)))
                .andExpect(status().isOk());
        mvc.perform(json(post("/api/auth/redefinir-senha"), """
                {"email": "%s", "codigoRecuperacao": "%s", "novaSenha": "outra-senha-999"}
                """.formatted(novoEmail, codigo)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void cadastroGeraNomeDeUsuarioETrataEmailSemDiferenciarMaiusculas() throws Exception {
        String email = emailUnico("julia");
        String token = cadastrar("Júlia Ferraz", email);

        mvc.perform(comToken(get("/api/me"), token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nomeUsuario").value(startsWith("juliaferraz")))
                .andExpect(jsonPath("$.tipo").value("USUARIO"));

        mvc.perform(json(post("/api/auth/cadastro"), """
                {"nome": "Outra", "email": "%s", "senha": "senha-forte-123"}
                """.formatted(email.toUpperCase())))
                .andExpect(status().isConflict());

        mvc.perform(json(post("/api/auth/login"), """
                {"email": "%s", "senha": "errada-123"}
                """.formatted(email)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void cadastroInvalidoDevolveOsCamposComErro() throws Exception {
        mvc.perform(json(post("/api/auth/cadastro"), """
                {"nome": "A", "email": "nao-e-email", "senha": "123"}
                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.nome").exists())
                .andExpect(jsonPath("$.campos.email").value("Informe um e-mail válido."))
                .andExpect(jsonPath("$.campos.senha").exists());
    }

    @Test
    void receitaNovaFicaPublicaImediatamente() throws Exception {
        String autor = novoUsuario();
        Integer id = criarReceita(autor, "Bolo de cenoura curadoria");

        mvc.perform(get("/api/receitas/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APROVADA"))
                .andExpect(jsonPath("$.ingredientes.length()").value(3))
                .andExpect(jsonPath("$.ingredientes[2].ingrediente").value("açúcar"))
                .andExpect(jsonPath("$.ingredientes[2].ordem").value(3))
                .andExpect(jsonPath("$.passos[1]").value("Asse a 180 °C por 40 minutos."));
        mvc.perform(get("/api/receitas").param("q", "cenoura curadoria"))
                .andExpect(jsonPath("$.total").value(1));
        mvc.perform(get("/api/receitas").param("q", "CENOURA curadoria"))
                .andExpect(jsonPath("$.itens[0].id").value(id));
        mvc.perform(get("/api/receitas").param("ingrediente", "cenoura").param("categoria", "doces"))
                .andExpect(jsonPath("$.itens[*].id", hasItem(id)));
    }

    @Test
    void buscaSuportaCategoriasCombinadasEPaginacao() throws Exception {
        String token = novoUsuario();
        String termo = "pagina-integracao-" + emailUnico("busca").replace("@teste.com", "");
        criarReceita(token, termo + " primeira");
        criarReceita(token, termo + " segunda");
        criarReceita(token, termo + " terceira");

        mvc.perform(get("/api/receitas").param("q", termo).param("categoria", "doces,bebidas")
                .param("pagina", "0").param("tamanho", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itens.length()").value(2))
                .andExpect(jsonPath("$.pagina").value(0))
                .andExpect(jsonPath("$.tamanho").value(2))
                .andExpect(jsonPath("$.total").value(3))
                .andExpect(jsonPath("$.totalPaginas").value(2));

        mvc.perform(get("/api/receitas").param("q", termo).param("categoria", "doces,bebidas")
                .param("pagina", "1").param("tamanho", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itens.length()").value(1))
                .andExpect(jsonPath("$.pagina").value(1));
    }

    @Test
    void buscaPorTituloIngredienteAutorETodosOsFiltrosAnunciados() throws Exception {
        String autor = novoUsuario();
        String termo = "filtro-api-" + emailUnico("termo").replace("@teste.com", "");
        Integer rapida = criarReceita(autor, termo + " rápida");
        String receitaLentaJson = receitaJson(termo + " lenta")
                .replace("\"tempoPreparo\": 50", "\"tempoPreparo\": 300")
                .replace("\"dificuldade\": \"FACIL\"", "\"dificuldade\": \"CHEF\"");
        String lentaCorpo = mvc.perform(comToken(json(post("/api/receitas"), receitaLentaJson), autor))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Integer lenta = JsonPath.read(lentaCorpo, "$.id");
        String avancadaJson = receitaJson(termo + " avançada")
                .replace("\"dificuldade\": \"FACIL\"", "\"dificuldade\": \"AVANCADO\"");
        String avancadaCorpo = mvc.perform(comToken(json(post("/api/receitas"), avancadaJson), autor))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Integer avancada = JsonPath.read(avancadaCorpo, "$.id");

        mvc.perform(get("/api/receitas").param("q", termo))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itens[*].id", hasItem(rapida)))
                .andExpect(jsonPath("$.itens[*].id", hasItem(lenta)));
        mvc.perform(get("/api/receitas").param("q", "Cenoura").param("pagina", "0").param("tamanho", "50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itens[*].id", hasItem(rapida)));
        mvc.perform(get("/api/receitas").param("q", "Pessoa Teste").param("pagina", "0").param("tamanho", "50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itens[*].id", hasItem(rapida)))
                .andExpect(jsonPath("$.itens[*].id", hasItem(lenta)));
        String nomeUsuario = JsonPath.read(
                mvc.perform(comToken(get("/api/me"), autor)).andReturn().getResponse().getContentAsString(),
                "$.nomeUsuario");
        mvc.perform(get("/api/receitas").param("q", "@" + nomeUsuario).param("pagina", "0").param("tamanho", "50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itens[*].id", hasItem(rapida)));
        mvc.perform(get("/api/receitas").param("q", termo).param("tempoMaximo", "60"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itens[*].id", hasItem(rapida)))
                .andExpect(jsonPath("$.itens[*].id", not(hasItem(lenta))));
        mvc.perform(get("/api/receitas").param("q", termo).param("dificuldade", "CHEF"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itens[*].id", hasItem(lenta)))
                .andExpect(jsonPath("$.itens[*].id", not(hasItem(rapida))));
        mvc.perform(get("/api/receitas").param("q", termo).param("dificuldade", "DIFICIL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itens[*].id", hasItem(avancada)))
                .andExpect(jsonPath("$.itens[*].id", not(hasItem(lenta))));

        String avaliador = novoUsuario();
        mvc.perform(comToken(json(post("/api/receitas/" + rapida + "/avaliacao"), avaliacaoJson(true, 5)), avaliador))
                .andExpect(status().isCreated());
        mvc.perform(comToken(json(post("/api/receitas/" + lenta + "/avaliacao"), avaliacaoJson(false, 5)), avaliador))
                .andExpect(status().isCreated());
        mvc.perform(get("/api/receitas").param("q", termo).param("taxaSucessoMinima", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itens[*].id", hasItem(rapida)))
                .andExpect(jsonPath("$.itens[*].id", not(hasItem(lenta))));

        Integer taxaSetenta = criarReceita(autor, termo + " setenta por cento");
        for (int i = 0; i < 10; i++) {
            mvc.perform(comToken(json(post("/api/receitas/" + taxaSetenta + "/avaliacao"),
                    avaliacaoJson(i < 7, 5)), novoUsuario())).andExpect(status().isCreated());
        }
        mvc.perform(get("/api/receitas").param("q", termo).param("taxaSucessoMinima", "80"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itens[*].id", hasItem(rapida)))
                .andExpect(jsonPath("$.itens[*].id", not(hasItem(taxaSetenta))))
                .andExpect(jsonPath("$.itens[*].id", not(hasItem(lenta))));
    }

    @Test
    void rankingOrdenaCadaAbaNoServidorESeparaAvaliacoesDeTestadores() throws Exception {
        String autor = novoUsuario();
        Integer maisAvaliacoes = criarReceita(autor, "Ranking por número de avaliações");
        Integer maisTestadores = criarReceita(autor, "Ranking por número de testadores");
        String testadorUnico = novoUsuario();
        for (int i = 0; i < 3; i++) {
            mvc.perform(comToken(json(post("/api/receitas/" + maisAvaliacoes + "/avaliacao"), avaliacaoJson(true, 4)), testadorUnico))
                    .andExpect(status().isCreated());
        }
        for (int i = 0; i < 2; i++) {
            mvc.perform(comToken(json(post("/api/receitas/" + maisTestadores + "/avaliacao"), avaliacaoJson(true, 4)), novoUsuario()))
                    .andExpect(status().isCreated());
        }

        String porAvaliacoes = mvc.perform(get("/api/receitas/ranking").param("ordem", "mais-avaliadas").param("limite", "50"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String porTestadores = mvc.perform(get("/api/receitas/ranking").param("ordem", "mais-testadas").param("limite", "50"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertThat(JsonPath.<List<Integer>>read(porAvaliacoes, "$[*].id").indexOf(maisAvaliacoes))
                .isLessThan(JsonPath.<List<Integer>>read(porAvaliacoes, "$[*].id").indexOf(maisTestadores));
        assertThat(JsonPath.<List<Integer>>read(porTestadores, "$[*].id").indexOf(maisTestadores))
                .isLessThan(JsonPath.<List<Integer>>read(porTestadores, "$[*].id").indexOf(maisAvaliacoes));
    }

    @Test
    void seguirAtualizaContadoresEListaPublica() throws Exception {
        String seguidor = novoUsuario();
        String seguido = novoUsuario();
        String dadosSeguido = mvc.perform(comToken(get("/api/me"), seguido))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String handleSeguido = JsonPath.read(dadosSeguido, "$.nomeUsuario");
        String dadosSeguidor = mvc.perform(comToken(get("/api/me"), seguidor))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String handleSeguidor = JsonPath.read(dadosSeguidor, "$.nomeUsuario");

        mvc.perform(comToken(put("/api/usuarios/" + handleSeguido + "/seguir"), seguidor))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/usuarios/" + handleSeguido))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estatisticas.seguidores").value(1));
        mvc.perform(get("/api/usuarios/" + handleSeguido + "/seguidores"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nomeUsuario").value(handleSeguidor));
        mvc.perform(get("/api/usuarios/" + handleSeguidor + "/seguindo"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nomeUsuario").value(handleSeguido));

        mvc.perform(comToken(delete("/api/usuarios/" + handleSeguido + "/seguir"), seguidor))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/usuarios/" + handleSeguido))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estatisticas.seguidores").value(0));
    }

    @Test
    void codigoDeRecuperacaoGeradoNasConfiguracoesPodeSerUsadoERegenerado() throws Exception {
        String token = novoUsuario();
        String email = mvc.perform(comToken(get("/api/me"), token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        email = JsonPath.read(email, "$.email");

        String codigoAntigo = mvc.perform(comToken(post("/api/me/codigo-recuperacao"), token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.codigoRecuperacao").isNotEmpty())
                .andReturn().getResponse().getContentAsString();
        codigoAntigo = JsonPath.read(codigoAntigo, "$.codigoRecuperacao");
        String codigoAtual = mvc.perform(comToken(post("/api/me/codigo-recuperacao"), token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        codigoAtual = JsonPath.read(codigoAtual, "$.codigoRecuperacao");

        mvc.perform(json(post("/api/auth/redefinir-senha"), """
                {"email": "%s", "codigoRecuperacao": "%s", "novaSenha": "senha-nova-456"}
                """.formatted(email, codigoAntigo)))
                .andExpect(status().isBadRequest());
        mvc.perform(json(post("/api/auth/redefinir-senha"), """
                {"email": "%s", "codigoRecuperacao": "%s", "novaSenha": "senha-nova-456"}
                """.formatted(email, codigoAtual)))
                .andExpect(status().isOk());
        mvc.perform(json(post("/api/auth/login"), """
                {"email": "%s", "senha": "senha-nova-456"}
                """.formatted(email)))
                .andExpect(status().isOk());
    }

    @Test
    void editarReceitaAprovadaContinuaPublica() throws Exception {
        String autor = novoUsuario();
        Integer id = criarReceita(autor, "Receita para editar");

        mvc.perform(comToken(json(put("/api/receitas/" + id), receitaJson("Receita editada")), novoUsuario()))
                .andExpect(status().isForbidden());
        mvc.perform(comToken(json(put("/api/receitas/" + id), receitaJson("Receita editada")), autor))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.titulo").value("Receita editada"))
                .andExpect(jsonPath("$.status").value("APROVADA"));
        mvc.perform(get("/api/receitas/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.titulo").value("Receita editada"));
    }

    @Test
    void rascunhoSoPodeSerLidoEditadoEExcluidoPeloAutor() throws Exception {
        String autor = novoUsuario();
        String outraPessoa = novoUsuario();
        String resposta = mvc.perform(comToken(json(post("/api/rascunhos"), """
                {"conteudo": {"titulo": "Bolo em construção", "resumo": "Primeira versão"}}
                """), autor))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.titulo").value("Bolo em construção"))
                .andReturn().getResponse().getContentAsString();
        Integer id = JsonPath.read(resposta, "$.id");

        mvc.perform(comToken(get("/api/rascunhos/" + id), outraPessoa))
                .andExpect(status().isNotFound());
        mvc.perform(comToken(json(put("/api/rascunhos/" + id), """
                {"conteudo": {"titulo": "Bolo pronto", "resumo": "Versão revisada"}}
                """), autor))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.titulo").value("Bolo pronto"))
                .andExpect(jsonPath("$.conteudo.resumo").value("Versão revisada"));
        mvc.perform(comToken(get("/api/rascunhos"), autor))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(id))
                .andExpect(jsonPath("$[0].origem").value("PROPRIA"));
        mvc.perform(comToken(json(post("/api/rascunhos"), """
                {"conteudo": {"titulo": "Receita indicada", "urlFonte": "https://example.com/receita"}}
                """), autor))
                .andExpect(status().isCreated());
        mvc.perform(comToken(get("/api/rascunhos"), autor))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].origem").value("EXTERNA"))
                .andExpect(jsonPath("$[1].origem").value("PROPRIA"));
        mvc.perform(comToken(delete("/api/rascunhos/" + id), autor))
                .andExpect(status().isNoContent());
        mvc.perform(comToken(get("/api/rascunhos/" + id), autor))
                .andExpect(status().isNotFound());
    }

    @Test
    void receitaExternaSoFicaPublicaDepoisDaAprovacaoEPodeSerRecusada() throws Exception {
        String autor = novoUsuario();
        String moderador = novoModerador();
        String corpoExterno = """
                {"urlFonte": "https://example.com/receita", "titulo": "%s",
                 "resumo": "Receita externa completa", "categoria": "doces",
                 "tempoPreparo": 30, "rendimento": "8 porções", "dificuldade": "FACIL",
                 "ingredientes": [
                   {"nome": "farinha", "quantidade": 200, "unidadeMedida": "g"},
                   {"nome": "açúcar", "quantidade": 100, "unidadeMedida": "g"}
                 ], "passos": ["Misture tudo.", "Asse até dourar."]}
                """;
        String pendente = mvc.perform(comToken(json(post("/api/receitas/indicacoes"),
                corpoExterno.formatted("Receita externa recusada")), autor))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Integer idRecusada = JsonPath.read(pendente, "$.id");
        mvc.perform(get("/api/receitas/" + idRecusada)).andExpect(status().isNotFound());
        mvc.perform(comToken(get("/api/receitas/" + idRecusada), autor))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDENTE"));
        mvc.perform(comToken(post("/api/moderacao/receitas/" + idRecusada + "/recusar"), moderador))
                .andExpect(status().isNoContent());
        mvc.perform(comToken(get("/api/receitas/" + idRecusada), autor))
                .andExpect(jsonPath("$.status").value("RECUSADA"));

        String aprovada = mvc.perform(comToken(json(post("/api/receitas/indicacoes"),
                corpoExterno.formatted("Receita externa aprovada")), autor))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Integer idAprovada = JsonPath.read(aprovada, "$.id");
        mvc.perform(comToken(post("/api/moderacao/receitas/" + idAprovada + "/aprovar"), moderador))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/receitas/" + idAprovada))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APROVADA"));
    }

    @Test
    void comentarioRespeitaAutoriaModeracaoEDenuncia() throws Exception {
        Integer receita = criarReceita(novoUsuario(), "Receita com comentário moderado");
        String autorComentario = novoUsuario();
        String outraPessoa = novoUsuario();
        String moderador = novoModerador();
        String corpo = mvc.perform(comToken(json(post("/api/receitas/" + receita + "/comentarios"), """
                {"texto": "Comentário que será moderado", "fotoResultado": null}
                """), autorComentario))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Integer comentario = JsonPath.read(corpo, "$.id");

        mvc.perform(comToken(delete("/api/comentarios/" + comentario), outraPessoa))
                .andExpect(status().isForbidden());
        String denuncia = mvc.perform(comToken(json(post("/api/denuncias"), """
                {"idComentario": %d, "motivo": "Conteúdo inadequado"}
                """.formatted(comentario)), outraPessoa))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Integer idDenuncia = JsonPath.read(denuncia, "$.id");
        mvc.perform(comToken(post("/api/moderacao/comentarios/" + comentario + "/ocultar"), moderador))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/receitas/" + receita + "/comentarios"))
                .andExpect(jsonPath("$.total").value(0));
        mvc.perform(comToken(post("/api/moderacao/comentarios/" + comentario + "/restaurar"), moderador))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/receitas/" + receita + "/comentarios"))
                .andExpect(jsonPath("$.total").value(1));
        mvc.perform(comToken(post("/api/moderacao/denuncias/" + idDenuncia
                + "/resolver?ocultarComentario=true"), moderador))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/receitas/" + receita + "/comentarios"))
                .andExpect(jsonPath("$.total").value(0));
        mvc.perform(comToken(delete("/api/comentarios/" + comentario), autorComentario))
                .andExpect(status().isNoContent());
    }

    @Test
    void excluirReceitaExigeAutoria() throws Exception {
        String autor = novoUsuario();
        String pessoa = novoUsuario();
        Integer receita = criarReceita(autor, "Receita que será excluída");
        mvc.perform(comToken(delete("/api/receitas/" + receita), pessoa))
                .andExpect(status().isForbidden());
        mvc.perform(comToken(delete("/api/receitas/" + receita), autor))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/receitas/" + receita)).andExpect(status().isNotFound());
    }

    @Test
    void cadaTesteCriaUmaAvaliacaoEComentarioPermaneceIndependente() throws Exception {
        String autor = novoUsuario();
        Integer id = criarReceita(autor, "Receita para avaliar");
        aprovar(novoModerador(), id);
        String pessoa = novoUsuario();

        mvc.perform(comToken(json(post("/api/receitas/" + id + "/avaliacao"), avaliacaoJson(true, 5)), autor))
                .andExpect(status().isForbidden());
        mvc.perform(comToken(json(post("/api/receitas/" + id + "/avaliacao"), avaliacaoJson(true, 6)), pessoa))
                .andExpect(status().isBadRequest());
        mvc.perform(comToken(json(post("/api/receitas/" + id + "/avaliacao"), """
                {"funcionou": true}
                """), pessoa))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.notas").value("Dê uma nota para todos os critérios."));

        mvc.perform(comToken(json(post("/api/receitas/" + id + "/avaliacao"), avaliacaoJson(true, 5)), pessoa))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estatisticasDaReceita.totalAvaliacoes").value(1))
                .andExpect(jsonPath("$.estatisticasDaReceita.totalTestadores").value(1));
        mvc.perform(comToken(json(post("/api/receitas/" + id + "/avaliacao"), """
                {"funcionou": false, "notas": {"medidas": 2, "tempo": 2, "rendimento": 2, "clareza": 2, "resultado": 2},
                 "comentario": "Ficou seco na primeira tentativa.",
                 "fotoResultado": "/uploads/resultado-teste.png"}
                """), pessoa))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estatisticasDaReceita.totalAvaliacoes").value(2))
                .andExpect(jsonPath("$.estatisticasDaReceita.totalTestadores").value(1))
                .andExpect(jsonPath("$.estatisticasDaReceita.mediaGeral").value(3.5))
                .andExpect(jsonPath("$.estatisticasDaReceita.taxaSucesso").value(50.0));

        mvc.perform(get("/api/receitas/" + id + "/comentarios"))
                .andExpect(jsonPath("$.itens.length()").value(1))
                .andExpect(jsonPath("$.itens[0].texto").value("Ficou seco na primeira tentativa."))
                .andExpect(jsonPath("$.itens[0].fotoResultado").value("/uploads/resultado-teste.png"));
        mvc.perform(get("/api/receitas/" + id + "/fotos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.itens[0].fotoResultado").value("/uploads/resultado-teste.png"));
        mvc.perform(comToken(json(post("/api/receitas/" + id + "/comentarios"),
                "{\"texto\":\"O segundo teste ficou melhor.\",\"fotoResultado\":\"/uploads/comentario.png\"}"),
                pessoa))
                .andExpect(status().isCreated());
        mvc.perform(get("/api/receitas/" + id + "/comentarios"))
                .andExpect(jsonPath("$.itens.length()").value(2))
                .andExpect(jsonPath("$.itens[0].texto").value("O segundo teste ficou melhor."))
                .andExpect(jsonPath("$.itens[1].texto").value("Ficou seco na primeira tentativa."));
        mvc.perform(get("/api/receitas/" + id + "/fotos?tamanho=1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.totalPaginas").value(2))
                .andExpect(jsonPath("$.itens[0].fotoResultado").value("/uploads/comentario.png"));
        mvc.perform(get("/api/receitas/" + id + "/fotos?tamanho=1&pagina=1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itens[0].fotoResultado").value("/uploads/resultado-teste.png"));
        mvc.perform(get("/api/receitas/" + id + "/avaliacoes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].funcionou").value(false))
                .andExpect(jsonPath("$[1].funcionou").value(true));
        mvc.perform(comToken(get("/api/receitas/" + id + "/avaliacao"), pessoa))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.funcionou").value(false));
        mvc.perform(comToken(get("/api/me/avaliacoes"), pessoa))
                .andExpect(jsonPath("$[0].idReceita").value(id))
                .andExpect(jsonPath("$[0].funcionou").value(false))
                .andExpect(jsonPath("$[1].idReceita").value(id));
        mvc.perform(comToken(get("/api/me"), pessoa))
                .andExpect(jsonPath("$.estatisticas.avaliacoes").value(2))
                .andExpect(jsonPath("$.estatisticas.receitasTestadas").value(1));
    }

    @Test
    void seloDeVerificadaExigeDezAvaliacoesBoas() throws Exception {
        Integer id = criarReceita(novoUsuario(), "Receita candidata a verificada");
        aprovar(novoModerador(), id);

        for (int i = 0; i < 9; i++) {
            mvc.perform(comToken(json(post("/api/receitas/" + id + "/avaliacao"), avaliacaoJson(true, 5)),
                    novoUsuario())).andExpect(status().isCreated());
        }
        mvc.perform(get("/api/receitas/" + id)).andExpect(jsonPath("$.estatisticas.verificada").value(false));

        mvc.perform(comToken(json(post("/api/receitas/" + id + "/avaliacao"), avaliacaoJson(true, 4)),
                novoUsuario())).andExpect(status().isCreated());
        mvc.perform(get("/api/receitas/" + id))
                .andExpect(jsonPath("$.estatisticas.verificada").value(true))
                .andExpect(jsonPath("$.estatisticas.totalAvaliacoes").value(10))
                .andExpect(jsonPath("$.estatisticas.totalTestadores").value(10))
                .andExpect(jsonPath("$.estatisticas.taxaSucesso").value(100.0))
                .andExpect(jsonPath("$.estatisticas.criterios.medidas").value(4.9));

        mvc.perform(get("/api/receitas").param("verificadas", "true"))
                .andExpect(jsonPath("$.itens[*].id", hasItem(id)));
        mvc.perform(get("/api/receitas/ranking"))
                .andExpect(jsonPath("$[0].estatisticas.verificada").value(true));
    }

    @Test
    void seloRespeitaOsLimitesDeMediaESucesso() throws Exception {
        Integer idLimiteExato = criarReceita(novoUsuario(), "Receita no limite exato");
        for (int i = 0; i < 10; i++) {
            mvc.perform(comToken(json(post("/api/receitas/" + idLimiteExato + "/avaliacao"),
                    avaliacaoJson(i < 8, 4)), novoUsuario()))
                    .andExpect(status().isCreated());
        }
        mvc.perform(get("/api/receitas/" + idLimiteExato))
                .andExpect(jsonPath("$.estatisticas.mediaGeral").value(4.0))
                .andExpect(jsonPath("$.estatisticas.taxaSucesso").value(80.0))
                .andExpect(jsonPath("$.estatisticas.verificada").value(true));

        Integer idSucessoAbaixoDoLimite = criarReceita(novoUsuario(), "Receita com sucesso abaixo do limite");
        for (int i = 0; i < 10; i++) {
            mvc.perform(comToken(json(post("/api/receitas/" + idSucessoAbaixoDoLimite + "/avaliacao"),
                    avaliacaoJson(i < 7, 5)), novoUsuario()))
                    .andExpect(status().isCreated());
        }
        mvc.perform(get("/api/receitas/" + idSucessoAbaixoDoLimite))
                .andExpect(jsonPath("$.estatisticas.mediaGeral").value(5.0))
                .andExpect(jsonPath("$.estatisticas.taxaSucesso").value(70.0))
                .andExpect(jsonPath("$.estatisticas.verificada").value(false));
    }

    @Test
    void variasTentativasDaMesmaPessoaNaoAtingemLimiteDeTestadores() throws Exception {
        Integer id = criarReceita(novoUsuario(), "Receita com várias tentativas da mesma pessoa");
        String pessoa = novoUsuario();
        for (int i = 0; i < 10; i++) {
            mvc.perform(comToken(json(post("/api/receitas/" + id + "/avaliacao"), avaliacaoJson(i < 8, 5)), pessoa))
                    .andExpect(status().isCreated());
        }
        mvc.perform(get("/api/receitas/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estatisticas.totalAvaliacoes").value(10))
                .andExpect(jsonPath("$.estatisticas.totalTestadores").value(1))
                .andExpect(jsonPath("$.estatisticas.verificada").value(false));
    }

    @Test
    void moderacaoSuspendeUsuarioDenunciado() throws Exception {
        String emailDenunciado = emailUnico("spam");
        String denunciado = cadastrar("Perfil de Spam", emailDenunciado);
        String nomeUsuario = JsonPath.read(mvc.perform(comToken(get("/api/me"), denunciado))
                .andReturn().getResponse().getContentAsString(), "$.nomeUsuario");
        Integer idDenunciado = JsonPath.read(mvc.perform(comToken(get("/api/me"), denunciado))
                .andReturn().getResponse().getContentAsString(), "$.id");
        Integer receitaDoDenunciado = criarReceita(denunciado, "Receita do usuário suspenso");
        String autorDaOutraReceita = novoUsuario();
        Integer outraReceita = criarReceita(autorDaOutraReceita, "Receita com comentário denunciado");
        aprovar(novoModerador(), outraReceita);
        String comentarioJson = mvc.perform(comToken(json(post("/api/receitas/" + outraReceita + "/comentarios"),
                "{\"texto\":\"Comentário antes da suspensão\"}"), denunciado))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        Integer comentarioId = JsonPath.read(comentarioJson, "$.id");
        String moderador = novoModerador();

        mvc.perform(comToken(get("/api/moderacao/resumo"), novoUsuario())).andExpect(status().isForbidden());
        mvc.perform(get("/api/moderacao/resumo")).andExpect(status().isUnauthorized());

        mvc.perform(comToken(json(post("/api/denuncias"), """
                {"nomeUsuario": "@%s", "motivo": "Links repetidos em várias receitas"}
                """.formatted(nomeUsuario)), novoUsuario()))
                .andExpect(status().isCreated());
        mvc.perform(comToken(get("/api/moderacao/usuarios"), moderador))
                .andExpect(jsonPath("$.itens[?(@.id == %d)].denunciasAbertas".formatted(idDenunciado)).value(1));

        mvc.perform(comToken(post("/api/moderacao/usuarios/" + idDenunciado + "/suspender"), moderador))
                .andExpect(status().isNoContent());
        mvc.perform(comToken(json(post("/api/receitas"), receitaJson("Receita de conta suspensa")), denunciado))
                .andExpect(status().isForbidden());
        mvc.perform(comToken(json(put("/api/me/senha"), """
                {"senhaAtual":"senha-forte-123","novaSenha":"senha-nova-456"}
                """), denunciado)).andExpect(status().isForbidden());
        mvc.perform(comToken(delete("/api/receitas/" + receitaDoDenunciado), denunciado))
                .andExpect(status().isForbidden());
        mvc.perform(comToken(delete("/api/comentarios/" + comentarioId), denunciado))
                .andExpect(status().isForbidden());
        mvc.perform(comToken(delete("/api/me"), denunciado)).andExpect(status().isForbidden());
        mvc.perform(comToken(get("/api/me"), denunciado)).andExpect(status().isOk());
        mvc.perform(json(post("/api/auth/login"), """
                {"email": "%s", "senha": "senha-forte-123"}
                """.formatted(emailDenunciado)))
                .andExpect(status().isForbidden());

        mvc.perform(comToken(post("/api/moderacao/usuarios/" + idDenunciado + "/reativar"), moderador))
                .andExpect(status().isNoContent());
        entrar(emailDenunciado);
    }

    @Test
    void excluirContaMantemAsReceitasSemAutor() throws Exception {
        String autor = novoUsuario();
        Integer id = criarReceita(autor, "Receita que fica no site");
        aprovar(novoModerador(), id);
        String nomeUsuario = JsonPath.read(mvc.perform(comToken(get("/api/me"), autor))
                .andReturn().getResponse().getContentAsString(), "$.nomeUsuario");
        mvc.perform(comToken(json(post("/api/denuncias"), """
                {"nomeUsuario":"%s","motivo":"Denúncia preservada após exclusão da conta"}
                """.formatted(nomeUsuario)), novoUsuario())).andExpect(status().isCreated());

        mvc.perform(comToken(delete("/api/me"), autor)).andExpect(status().isNoContent());

        mvc.perform(get("/api/receitas/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.autor").value(nullValue()));
        mvc.perform(comToken(get("/api/moderacao/denuncias"), novoModerador()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itens[0].denunciado.id").value(nullValue()))
                .andExpect(jsonPath("$.itens[0].denunciado.nome").value("Conta excluída"))
                .andExpect(jsonPath("$.itens[0].motivo").value("Denúncia preservada após exclusão da conta"));
        mvc.perform(comToken(get("/api/me"), autor)).andExpect(status().isUnauthorized());

        String moderadorExcluido = novoModerador();
        mvc.perform(comToken(delete("/api/me"), moderadorExcluido)).andExpect(status().isNoContent());
        mvc.perform(comToken(get("/api/moderacao/resumo"), moderadorExcluido))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void indicacaoExigeLinkValido() throws Exception {
        String token = novoUsuario();
        mvc.perform(comToken(json(post("/api/receitas/indicacoes"), """
                {"urlFonte": "javascript:alert(1)", "titulo": "Pão de queijo", "categoria": "paes"}
                """), token))
                .andExpect(status().isBadRequest());
        String corpo = mvc.perform(comToken(json(post("/api/receitas/indicacoes"), """
                {"urlFonte": "https://blogdacozinha.com/pao-de-queijo", "titulo": "Pão de queijo",
                 "resumo": "Uma receita simples e bem testada.", "categoria": "paes",
                 "tempoPreparo": 45, "rendimento": "30 unidades", "dificuldade": "MEDIO",
                 "faixaCusto": "BAIXO", "ingredientes": [
                   {"nome": "polvilho", "quantidade": 500, "unidadeMedida": "g"},
                   {"nome": "queijo", "quantidade": 200, "unidadeMedida": "g"}
                 ], "passos": ["Misture os ingredientes.", "Asse até dourar."]}
                """), token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.origem").value("EXTERNA"))
                .andExpect(jsonPath("$.status").value("PENDENTE"))
                .andExpect(jsonPath("$.urlFonte").value("https://blogdacozinha.com/pao-de-queijo"))
                .andExpect(jsonPath("$.resumo").value("Uma receita simples e bem testada."))
                .andExpect(jsonPath("$.tempoPreparo").value(45))
                .andExpect(jsonPath("$.rendimento").value("30 unidades"))
                .andExpect(jsonPath("$.ingredientes.length()").value(2))
                .andExpect(jsonPath("$.passos.length()").value(2))
                .andReturn().getResponse().getContentAsString();
        Integer id = JsonPath.read(corpo, "$.id");
        mvc.perform(comToken(get("/api/moderacao/receitas"), novoModerador()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itens[*].id", hasItem(id)));
    }

    @Test
    void uploadAceitaSoImagensDeVerdade() throws Exception {
        String token = novoUsuario();
        byte[] png = java.util.Base64.getDecoder().decode(
                "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADUlEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC");

        String corpo = mvc.perform(comToken(multipart("/api/uploads")
                .file(new MockMultipartFile("arquivo", "foto.png", "image/png", png)), token))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String url = JsonPath.read(corpo, "$.url");
        mvc.perform(get(url)).andExpect(status().isOk()).andExpect(content().bytes(png));

        mvc.perform(comToken(multipart("/api/uploads").file(
                new MockMultipartFile("arquivo", "foto.png", "image/png", "<script>".getBytes())), token))
                .andExpect(status().isBadRequest());

        byte[] webp = java.util.Base64.getDecoder().decode(
                "UklGRjwAAABXRUJQVlA4IDAAAADQAQCdASoBAAEAAgA0JaACdLoB+AADsAD+8MQL/yC5YXXI1/8gP+QH/ID/+PIAAAA=");
        String corpoWebp = mvc.perform(comToken(multipart("/api/uploads")
                .file(new MockMultipartFile("arquivo", "foto.webp", "image/webp", webp)), token))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String urlWebp = JsonPath.read(corpoWebp, "$.url");
        mvc.perform(get(urlWebp)).andExpect(status().isOk()).andExpect(content().bytes(webp));

        byte[] webpComCabecalhoMasInvalido = new byte[] {
                'R', 'I', 'F', 'F', 17, 0, 0, 0, 'W', 'E', 'B', 'P',
                'V', 'P', '8', 'L', 5, 0, 0, 0, 1, 2, 3, 4, 5
        };
        mvc.perform(comToken(multipart("/api/uploads").file(
                new MockMultipartFile("arquivo", "invalida.webp", "image/webp", webpComCabecalhoMasInvalido)), token))
                .andExpect(status().isBadRequest());
    }

    @Test
    void categoriasContamSoReceitasAprovadas() throws Exception {
        mvc.perform(get("/api/categorias"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(6))
                .andExpect(jsonPath("$[*].slug", hasItem("vegetariano")))
                .andExpect(jsonPath("$[*].slug", not(hasItem("inexistente"))));
    }
}
