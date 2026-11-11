package br.com.cookie.api.receita;

import java.util.List;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.core.JacksonException;

import br.com.cookie.api.comum.ApiException;
import br.com.cookie.api.usuario.Usuario;
import br.com.cookie.api.usuario.UsuarioService;

@Service
public class RascunhoReceitaService {

    private static final int LIMITE_CONTEUDO = 1_000_000;
    private final RascunhoReceitaRepository rascunhos;
    private final UsuarioService usuarios;
    private final ObjectMapper json;

    public RascunhoReceitaService(RascunhoReceitaRepository rascunhos, UsuarioService usuarios, ObjectMapper json) {
        this.rascunhos = rascunhos;
        this.usuarios = usuarios;
        this.json = json;
    }

    @Transactional(readOnly = true)
    public List<RascunhoResumo> listar(Jwt jwt) {
        Usuario autor = usuarios.logado(jwt);
        return rascunhos.findByAutorIdOrderByAtualizadoEmDesc(autor.getId()).stream()
                .map(r -> new RascunhoResumo(r.getId(), r.getTitulo(), r.getAtualizadoEm())).toList();
    }

    @Transactional(readOnly = true)
    public RascunhoDetalhe obter(Jwt jwt, Integer id) {
        RascunhoReceita rascunho = meuRascunho(jwt, id);
        return detalhe(rascunho);
    }

    @Transactional
    public RascunhoDetalhe criar(Jwt jwt, ConteudoRascunho request) {
        Usuario autor = usuarios.ativo(jwt);
        return detalhe(rascunhos.save(new RascunhoReceita(autor, titulo(request.conteudo()), serializar(request.conteudo()))));
    }

    @Transactional
    public RascunhoDetalhe atualizar(Jwt jwt, Integer id, ConteudoRascunho request) {
        usuarios.ativo(jwt);
        RascunhoReceita rascunho = meuRascunho(jwt, id);
        rascunho.atualizar(titulo(request.conteudo()), serializar(request.conteudo()));
        return detalhe(rascunhos.save(rascunho));
    }

    @Transactional
    public void excluir(Jwt jwt, Integer id) {
        usuarios.ativo(jwt);
        rascunhos.delete(meuRascunho(jwt, id));
    }

    private RascunhoReceita meuRascunho(Jwt jwt, Integer id) {
        Usuario autor = usuarios.logado(jwt);
        return rascunhos.findByIdAndAutorId(id, autor.getId())
                .orElseThrow(() -> ApiException.naoEncontrado("Rascunho não encontrado."));
    }

    private String serializar(JsonNode conteudo) {
        try {
            String resultado = json.writeValueAsString(conteudo);
            if (resultado.length() > LIMITE_CONTEUDO) throw ApiException.invalido("O rascunho excede o limite de tamanho.");
            return resultado;
        } catch (JacksonException e) {
            throw ApiException.invalido("Não foi possível salvar o conteúdo do rascunho.");
        }
    }

    private String titulo(JsonNode conteudo) {
        JsonNode titulo = conteudo.get("titulo");
        if (titulo == null || !titulo.isTextual()) return "";
        return titulo.asText().trim().substring(0, Math.min(200, titulo.asText().trim().length()));
    }

    private RascunhoDetalhe detalhe(RascunhoReceita rascunho) {
        try { return new RascunhoDetalhe(rascunho.getId(), rascunho.getTitulo(), json.readTree(rascunho.getConteudo()), rascunho.getAtualizadoEm()); }
        catch (JacksonException e) { throw new IllegalStateException("Conteúdo de rascunho inválido no banco.", e); }
    }

    public record ConteudoRascunho(JsonNode conteudo) {
        public ConteudoRascunho {
            if (conteudo == null || !conteudo.isObject()) throw ApiException.invalido("Envie o conteúdo do rascunho como um objeto JSON.");
        }
    }
    public record RascunhoResumo(Integer id, String titulo, java.time.Instant atualizadoEm) {}
    public record RascunhoDetalhe(Integer id, String titulo, JsonNode conteudo, java.time.Instant atualizadoEm) {}
}
