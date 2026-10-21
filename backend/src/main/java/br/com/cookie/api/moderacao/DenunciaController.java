package br.com.cookie.api.moderacao;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.com.cookie.api.moderacao.ModeracaoDtos.DenunciaRequest;
import br.com.cookie.api.moderacao.ModeracaoDtos.DenunciaResponse;
import jakarta.validation.Valid;

@RestController
public class DenunciaController {

    private final ModeracaoService moderacao;

    public DenunciaController(ModeracaoService moderacao) {
        this.moderacao = moderacao;
    }

    @PostMapping("/api/denuncias")
    @ResponseStatus(HttpStatus.CREATED)
    DenunciaResponse denunciar(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody DenunciaRequest req) {
        return moderacao.denunciar(jwt, req);
    }
}
