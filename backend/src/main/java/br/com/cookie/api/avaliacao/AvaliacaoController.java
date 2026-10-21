package br.com.cookie.api.avaliacao;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.com.cookie.api.avaliacao.AvaliacaoDtos.AvaliacaoRequest;
import br.com.cookie.api.avaliacao.AvaliacaoDtos.AvaliacaoResponse;
import jakarta.validation.Valid;

/** A avaliação da pessoa logada em uma receita: /api/receitas/{id}/avaliacao. */
@RestController
@RequestMapping("/api/receitas/{idReceita}/avaliacao")
public class AvaliacaoController {

    private final AvaliacaoService avaliacoes;

    public AvaliacaoController(AvaliacaoService avaliacoes) {
        this.avaliacoes = avaliacoes;
    }

    /** PUT porque é idempotente: avaliar de novo substitui a avaliação anterior. 201 na primeira vez. */
    @PutMapping
    ResponseEntity<AvaliacaoResponse> avaliar(@AuthenticationPrincipal Jwt jwt, @PathVariable Integer idReceita,
            @Valid @RequestBody AvaliacaoRequest req) {
        var resultado = avaliacoes.avaliar(jwt, idReceita, req);
        return ResponseEntity.status(resultado.criada() ? HttpStatus.CREATED : HttpStatus.OK)
                .body(resultado.avaliacao());
    }

    @GetMapping
    AvaliacaoResponse minha(@AuthenticationPrincipal Jwt jwt, @PathVariable Integer idReceita) {
        return avaliacoes.minha(jwt, idReceita);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void remover(@AuthenticationPrincipal Jwt jwt, @PathVariable Integer idReceita) {
        avaliacoes.remover(jwt, idReceita);
    }
}
