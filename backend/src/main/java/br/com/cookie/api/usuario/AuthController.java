package br.com.cookie.api.usuario;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import br.com.cookie.api.usuario.UsuarioDtos.CadastroRequest;
import br.com.cookie.api.usuario.UsuarioDtos.LoginRequest;
import br.com.cookie.api.usuario.UsuarioDtos.TokenResponse;
import br.com.cookie.api.usuario.UsuarioDtos.RedefinirSenhaRequest;
import br.com.cookie.api.usuario.UsuarioDtos.PerfilResponse;
import br.com.cookie.api.seguranca.SessionCookieService;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UsuarioService usuarios;
    private final SessionCookieService cookies;
    public AuthController(UsuarioService usuarios, SessionCookieService cookies) {
        this.usuarios = usuarios;
        this.cookies = cookies;
    }

    @PostMapping("/cadastro")
    ResponseEntity<AuthResponse> cadastrar(@Valid @RequestBody CadastroRequest req, HttpServletResponse response) {
        TokenResponse session = usuarios.cadastrar(req);
        cookies.set(response, session.usuario().id(), session.token(), session.expiraEm());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new AuthResponse(session.usuario(), session.codigoRecuperacao()));
    }

    @PostMapping("/login")
    ResponseEntity<AuthResponse> entrar(@Valid @RequestBody LoginRequest req, HttpServletResponse response) {
        TokenResponse session = usuarios.entrar(req);
        cookies.set(response, session.usuario().id(), session.token(), session.expiraEm());
        return ResponseEntity.ok(new AuthResponse(session.usuario(), session.codigoRecuperacao()));
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void sair(@RequestHeader("X-Session-Id") Integer id, HttpServletResponse response) {
        cookies.clear(response, id);
    }

    @PostMapping("/redefinir-senha")
    UsuarioDtos.CodigoRecuperacaoResponse redefinirSenha(@Valid @RequestBody RedefinirSenhaRequest req) {
        return usuarios.redefinirSenha(req);
    }

    public record AuthResponse(PerfilResponse usuario, String codigoRecuperacao) {}
}
