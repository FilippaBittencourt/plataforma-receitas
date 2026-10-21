package br.com.cookie.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.AbstractMockHttpServletRequestBuilder;

import com.jayway.jsonpath.JsonPath;

import br.com.cookie.api.usuario.TipoUsuario;
import br.com.cookie.api.usuario.UsuarioRepository;

/** Sobe a aplicação inteira contra um PostgreSQL real (Testcontainers) e oferece atalhos para os testes. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")
public abstract class ApiTestBase {

    private static final AtomicInteger SEQUENCIA = new AtomicInteger();

    @Autowired
    protected MockMvc mvc;

    @Autowired
    protected UsuarioRepository usuarioRepository;

    /** E-mail único por chamada, porque o banco é compartilhado entre os testes. */
    protected static String emailUnico(String prefixo) {
        return prefixo + SEQUENCIA.incrementAndGet() + "@teste.com";
    }

    protected static <B extends AbstractMockHttpServletRequestBuilder<B>> B json(B req, String corpo) {
        return req.contentType(MediaType.APPLICATION_JSON).content(corpo);
    }

    protected static <B extends AbstractMockHttpServletRequestBuilder<B>> B comToken(B req, String token) {
        return req.header("Authorization", "Bearer " + token);
    }

    protected String cadastrar(String nome, String email) throws Exception {
        String corpo = mvc.perform(json(post("/api/auth/cadastro"), """
                {"nome": "%s", "email": "%s", "senha": "senha-forte-123"}
                """.formatted(nome, email)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(corpo, "$.token");
    }

    protected String novoUsuario() throws Exception {
        return cadastrar("Pessoa Teste", emailUnico("pessoa"));
    }

    protected String entrar(String email) throws Exception {
        String corpo = mvc.perform(json(post("/api/auth/login"), """
                {"email": "%s", "senha": "senha-forte-123"}
                """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(corpo, "$.token");
    }

    protected String novoModerador() throws Exception {
        String email = emailUnico("moderador");
        cadastrar("Moderação Teste", email);
        var usuario = usuarioRepository.findByEmail(email).orElseThrow();
        usuario.setTipo(TipoUsuario.ADMINISTRADOR);
        usuarioRepository.save(usuario);
        return entrar(email);
    }

    protected static String receitaJson(String titulo) {
        return """
                {
                  "titulo": "%s",
                  "resumo": "Receita de teste",
                  "categoria": "doces",
                  "tempoPreparo": 50,
                  "rendimento": "1 forma",
                  "dificuldade": "FACIL",
                  "ingredientes": [
                    {"nome": "Cenoura", "quantidade": 300, "unidadeMedida": "g", "observacao": "descascada"},
                    {"nome": "Açúcar", "quantidade": 200, "unidadeMedida": "g"},
                    {"nome": "açúcar", "quantidade": 50, "unidadeMedida": "g", "observacao": "para a calda"}
                  ],
                  "passos": ["Bata tudo no liquidificador.", "Asse a 180 °C por 40 minutos."]
                }
                """.formatted(titulo);
    }

    protected Integer criarReceita(String token, String titulo) throws Exception {
        String corpo = mvc.perform(comToken(json(post("/api/receitas"), receitaJson(titulo)), token))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(corpo, "$.id");
    }

    protected void aprovar(String tokenModerador, Integer idReceita) throws Exception {
        mvc.perform(comToken(post("/api/moderacao/receitas/" + idReceita + "/aprovar"), tokenModerador))
                .andExpect(status().isNoContent());
    }

    protected static String avaliacaoJson(boolean funcionou, int nota) {
        return """
                {"funcionou": %s, "notas": {"medidas": %d, "tempo": %d, "rendimento": %d, "clareza": %d, "resultado": %d}}
                """.formatted(funcionou, nota, nota, nota, nota, nota);
    }
}
