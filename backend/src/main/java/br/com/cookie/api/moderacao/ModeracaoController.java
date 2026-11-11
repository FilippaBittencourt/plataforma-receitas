package br.com.cookie.api.moderacao;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.com.cookie.api.comentario.StatusComentario;
import br.com.cookie.api.moderacao.ModeracaoDtos.DenunciaResponse;
import br.com.cookie.api.moderacao.ModeracaoDtos.ReceitaNaFila;
import br.com.cookie.api.moderacao.ModeracaoDtos.ResumoModeracao;
import br.com.cookie.api.moderacao.ModeracaoDtos.UsuarioDenunciado;
import br.com.cookie.api.moderacao.ModeracaoDtos.UsuarioGestao;
import br.com.cookie.api.receita.StatusReceita;
import br.com.cookie.api.usuario.StatusUsuario;

/** Área da moderação. O acesso exige papel ADMINISTRADOR (ver SegurancaConfig). */
@RestController
@RequestMapping("/api/moderacao")
public class ModeracaoController {

    private final ModeracaoService moderacao;

    public ModeracaoController(ModeracaoService moderacao) {
        this.moderacao = moderacao;
    }

    @GetMapping("/resumo")
    ResumoModeracao resumo() {
        return moderacao.resumo();
    }

    @GetMapping("/receitas")
    List<ReceitaNaFila> fila() {
        return moderacao.fila();
    }

    @PostMapping("/receitas/{id}/aprovar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void aprovar(@PathVariable Integer id) {
        moderacao.moderarReceita(id, StatusReceita.APROVADA);
    }

    @PostMapping("/receitas/{id}/recusar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void recusar(@PathVariable Integer id) {
        moderacao.moderarReceita(id, StatusReceita.RECUSADA);
    }

    @PostMapping("/comentarios/{id}/ocultar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void ocultarComentario(@PathVariable Integer id) {
        moderacao.mudarStatusComentario(id, StatusComentario.OCULTO);
    }

    @PostMapping("/comentarios/{id}/restaurar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void restaurarComentario(@PathVariable Integer id) {
        moderacao.mudarStatusComentario(id, StatusComentario.VISIVEL);
    }

    @GetMapping("/denuncias")
    List<DenunciaResponse> denuncias() {
        return moderacao.denunciasAbertas();
    }

    @PostMapping("/denuncias/{id}/resolver")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void resolver(@PathVariable Integer id) {
        moderacao.resolverDenuncia(id);
    }

    @GetMapping("/usuarios")
    List<UsuarioDenunciado> usuariosDenunciados() {
        return moderacao.usuariosDenunciados();
    }

    @GetMapping("/usuarios/gestao")
    List<UsuarioGestao> usuariosParaGestao(@RequestParam(required = false) String q) {
        return moderacao.usuariosParaGestao(q);
    }

    @PostMapping("/usuarios/{id}/suspender")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void suspender(@AuthenticationPrincipal Jwt jwt, @PathVariable Integer id) {
        moderacao.mudarStatusUsuario(jwt, id, StatusUsuario.SUSPENSO);
    }

    @PostMapping("/usuarios/{id}/reativar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void reativar(@AuthenticationPrincipal Jwt jwt, @PathVariable Integer id) {
        moderacao.mudarStatusUsuario(jwt, id, StatusUsuario.ATIVO);
    }
}
