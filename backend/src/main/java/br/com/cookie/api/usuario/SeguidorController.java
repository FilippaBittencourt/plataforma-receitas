package br.com.cookie.api.usuario;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/usuarios/{nomeUsuario}/seguir")
public class SeguidorController {

    private final SeguidorService seguidores;

    public SeguidorController(SeguidorService seguidores) {
        this.seguidores = seguidores;
    }

    @PutMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void seguir(@AuthenticationPrincipal Jwt jwt, @PathVariable String nomeUsuario) {
        seguidores.seguir(jwt, nomeUsuario);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deixarDeSeguir(@AuthenticationPrincipal Jwt jwt, @PathVariable String nomeUsuario) {
        seguidores.deixarDeSeguir(jwt, nomeUsuario);
    }

    @GetMapping
    SeguirStatus status(@AuthenticationPrincipal Jwt jwt, @PathVariable String nomeUsuario) {
        return new SeguirStatus(seguidores.estaSeguindo(jwt, nomeUsuario));
    }

    record SeguirStatus(boolean seguindo) {}
}
