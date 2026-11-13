package br.com.cookie.api;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import com.jayway.jsonpath.JsonPath;

class FluxosDaApiTest extends ApiTestBase {

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
        String moderador = novoModerador();

        mvc.perform(comToken(get("/api/moderacao/resumo"), novoUsuario())).andExpect(status().isForbidden());
        mvc.perform(get("/api/moderacao/resumo")).andExpect(status().isUnauthorized());

        mvc.perform(comToken(json(post("/api/denuncias"), """
                {"nomeUsuario": "@%s", "motivo": "Links repetidos em várias receitas"}
                """.formatted(nomeUsuario)), novoUsuario()))
                .andExpect(status().isCreated());
        mvc.perform(comToken(get("/api/moderacao/usuarios"), moderador))
                .andExpect(jsonPath("$[?(@.id == %d)].denunciasAbertas".formatted(idDenunciado)).value(1));

        mvc.perform(comToken(post("/api/moderacao/usuarios/" + idDenunciado + "/suspender"), moderador))
                .andExpect(status().isNoContent());
        mvc.perform(comToken(json(post("/api/receitas"), receitaJson("Receita de conta suspensa")), denunciado))
                .andExpect(status().isForbidden());
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

        mvc.perform(comToken(delete("/api/me"), autor)).andExpect(status().isNoContent());

        mvc.perform(get("/api/receitas/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.autor").value(nullValue()));
        mvc.perform(comToken(get("/api/me"), autor)).andExpect(status().isUnauthorized());
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
                .andExpect(jsonPath("$[*].id", hasItem(id)));
    }

    @Test
    void uploadAceitaSoImagensDeVerdade() throws Exception {
        String token = novoUsuario();
        byte[] png = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0};

        String corpo = mvc.perform(comToken(multipart("/api/uploads")
                .file(new MockMultipartFile("arquivo", "foto.png", "image/png", png)), token))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String url = JsonPath.read(corpo, "$.url");
        mvc.perform(get(url)).andExpect(status().isOk()).andExpect(content().bytes(png));

        mvc.perform(comToken(multipart("/api/uploads").file(
                new MockMultipartFile("arquivo", "foto.png", "image/png", "<script>".getBytes())), token))
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
