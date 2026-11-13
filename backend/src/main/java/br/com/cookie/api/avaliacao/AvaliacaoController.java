package br.com.cookie.api.avaliacao;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.com.cookie.api.avaliacao.AvaliacaoDtos.AvaliacaoRequest;
import br.com.cookie.api.avaliacao.AvaliacaoDtos.AvaliacaoPublica;
import br.com.cookie.api.avaliacao.AvaliacaoDtos.AvaliacaoResponse;
import jakarta.validation.Valid;

/** A avaliação da pessoa logada em uma receita: /api/receitas/{id}/avaliacao. */
@RestController
@RequestMapping("/api/receitas/{idReceita}")
public class AvaliacaoController {

    private final AvaliacaoService avaliacoes;

    public AvaliacaoController(AvaliacaoService avaliacoes) {
        this.avaliacoes = avaliacoes;
    }

    @PostMapping("/avaliacao")
    @ResponseStatus(HttpStatus.CREATED)
    AvaliacaoResponse avaliar(@AuthenticationPrincipal Jwt jwt, @PathVariable Integer idReceita,
            @Valid @RequestBody AvaliacaoRequest req) {
        return avaliacoes.avaliar(jwt, idReceita, req);
    }

    @GetMapping("/avaliacao")
    AvaliacaoResponse minha(@AuthenticationPrincipal Jwt jwt, @PathVariable Integer idReceita) {
        return avaliacoes.minha(jwt, idReceita);
    }

    @GetMapping("/avaliacoes")
    List<AvaliacaoPublica> listar(@AuthenticationPrincipal Jwt jwt, @PathVariable Integer idReceita) {
        return avaliacoes.listar(idReceita, jwt);
    }

}
