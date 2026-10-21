package br.com.cookie.api.comentario;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.com.cookie.api.comentario.ComentarioDtos.ComentarioRequest;
import br.com.cookie.api.comentario.ComentarioDtos.ComentarioResponse;
import br.com.cookie.api.comum.Pagina;
import jakarta.validation.Valid;

@RestController
public class ComentarioController {

    private final ComentarioService comentarios;

    public ComentarioController(ComentarioService comentarios) {
        this.comentarios = comentarios;
    }

    @GetMapping("/api/receitas/{idReceita}/comentarios")
    Pagina<ComentarioResponse> listar(@PathVariable Integer idReceita, @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "10") int tamanho) {
        return comentarios.listar(idReceita, PageRequest.of(Math.max(pagina, 0), Math.clamp(tamanho, 1, 50)));
    }

    @PostMapping("/api/receitas/{idReceita}/comentarios")
    @ResponseStatus(HttpStatus.CREATED)
    ComentarioResponse comentar(@AuthenticationPrincipal Jwt jwt, @PathVariable Integer idReceita,
            @Valid @RequestBody ComentarioRequest req) {
        return comentarios.comentar(jwt, idReceita, req);
    }

    @DeleteMapping("/api/comentarios/{idComentario}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void excluir(@AuthenticationPrincipal Jwt jwt, @PathVariable Integer idComentario) {
        comentarios.excluir(jwt, idComentario);
    }
}
