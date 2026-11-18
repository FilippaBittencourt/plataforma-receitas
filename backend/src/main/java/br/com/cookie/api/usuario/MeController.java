package br.com.cookie.api.usuario;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.com.cookie.api.avaliacao.AvaliacaoDtos.MinhaAvaliacao;
import br.com.cookie.api.avaliacao.AvaliacaoService;
import br.com.cookie.api.receita.ReceitaDtos.MinhaReceita;
import br.com.cookie.api.receita.ReceitaService;
import br.com.cookie.api.usuario.UsuarioDtos.AlterarEmailRequest;
import br.com.cookie.api.usuario.UsuarioDtos.AlterarSenhaRequest;
import br.com.cookie.api.usuario.UsuarioDtos.AtualizarPerfilRequest;
import br.com.cookie.api.usuario.UsuarioDtos.CodigoRecuperacaoResponse;
import br.com.cookie.api.usuario.UsuarioDtos.PerfilResponse;
import br.com.cookie.api.seguranca.SessionCookieService;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletResponse;

/** Conta da pessoa logada (tela de perfil e de configurações). */
@RestController
@RequestMapping("/api/me")
public class MeController {

    private final UsuarioService usuarios;
    private final ReceitaService receitas;
    private final AvaliacaoService avaliacoes;
    private final SessionCookieService cookies;

    public MeController(UsuarioService usuarios, ReceitaService receitas, AvaliacaoService avaliacoes,
            SessionCookieService cookies) {
        this.usuarios = usuarios;
        this.receitas = receitas;
        this.avaliacoes = avaliacoes;
        this.cookies = cookies;
    }

    @GetMapping
    PerfilResponse perfil(@AuthenticationPrincipal Jwt jwt) {
        return usuarios.perfil(jwt);
    }

    @PatchMapping
    PerfilResponse atualizar(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody AtualizarPerfilRequest req) {
        return usuarios.atualizarPerfil(jwt, req);
    }

    @PutMapping("/email")
    PerfilResponse alterarEmail(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody AlterarEmailRequest req) {
        return usuarios.alterarEmail(jwt, req);
    }

    @PutMapping("/senha")
    ResponseEntity<PerfilResponse> alterarSenha(@AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody AlterarSenhaRequest req, HttpServletResponse response) {
        var token = usuarios.alterarSenha(jwt, req);
        cookies.set(response, token.usuario().id(), token.token(), token.expiraEm());
        return ResponseEntity.ok(token.usuario());
    }

    @PostMapping("/codigo-recuperacao")
    CodigoRecuperacaoResponse gerarCodigoRecuperacao(@AuthenticationPrincipal Jwt jwt) {
        return usuarios.gerarCodigoRecuperacao(jwt);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void excluir(@AuthenticationPrincipal Jwt jwt, HttpServletResponse response) {
        cookies.clear(response, Integer.valueOf(jwt.getSubject()));
        usuarios.excluir(jwt);
    }

    /** Todas as receitas da pessoa, inclusive pendentes e recusadas. */
    @GetMapping("/receitas")
    List<MinhaReceita> minhasReceitas(@AuthenticationPrincipal Jwt jwt) {
        return receitas.minhas(usuarios.logado(jwt));
    }

    @GetMapping("/avaliacoes")
    List<MinhaAvaliacao> minhasAvaliacoes(@AuthenticationPrincipal Jwt jwt) {
        return avaliacoes.minhas(usuarios.logado(jwt));
    }

}
