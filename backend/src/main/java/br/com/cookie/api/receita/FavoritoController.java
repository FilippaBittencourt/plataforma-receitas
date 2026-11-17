package br.com.cookie.api.receita;

import java.util.List;

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

import br.com.cookie.api.receita.ReceitaDtos.ReceitaResumo;

@RestController
@RequestMapping("/api")
public class FavoritoController {

    private final FavoritoService favoritos;

    public FavoritoController(FavoritoService favoritos) {
        this.favoritos = favoritos;
    }

    @PutMapping("/receitas/{id}/favorito")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void favoritar(@AuthenticationPrincipal Jwt jwt, @PathVariable Integer id) {
        favoritos.favoritar(jwt, id);
    }

    @DeleteMapping("/receitas/{id}/favorito")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void remover(@AuthenticationPrincipal Jwt jwt, @PathVariable Integer id) {
        favoritos.remover(jwt, id);
    }

    @GetMapping("/receitas/{id}/favorito")
    FavoritoStatus status(@AuthenticationPrincipal Jwt jwt, @PathVariable Integer id) {
        return new FavoritoStatus(favoritos.estaFavorita(jwt, id));
    }

    @GetMapping("/me/favoritos/ids")
    List<Integer> ids(@AuthenticationPrincipal Jwt jwt) {
        return favoritos.ids(jwt);
    }

    @GetMapping("/me/favoritos")
    List<ReceitaResumo> listar(@AuthenticationPrincipal Jwt jwt) {
        return favoritos.listar(jwt);
    }

    record FavoritoStatus(boolean favorito) {}
}
