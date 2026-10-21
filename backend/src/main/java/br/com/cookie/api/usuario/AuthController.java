package br.com.cookie.api.usuario;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.com.cookie.api.usuario.UsuarioDtos.CadastroRequest;
import br.com.cookie.api.usuario.UsuarioDtos.LoginRequest;
import br.com.cookie.api.usuario.UsuarioDtos.TokenResponse;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UsuarioService usuarios;

    public AuthController(UsuarioService usuarios) {
        this.usuarios = usuarios;
    }

    @PostMapping("/cadastro")
    @ResponseStatus(HttpStatus.CREATED)
    TokenResponse cadastrar(@Valid @RequestBody CadastroRequest req) {
        return usuarios.cadastrar(req);
    }

    @PostMapping("/login")
    TokenResponse entrar(@Valid @RequestBody LoginRequest req) {
        return usuarios.entrar(req);
    }
}
