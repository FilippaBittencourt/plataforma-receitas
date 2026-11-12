package br.com.cookie.api.assistente;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.cookie.api.assistente.AssistenteReceitaDtos.Pergunta;
import br.com.cookie.api.assistente.AssistenteReceitaDtos.Resposta;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/assistente")
public class AssistenteReceitaController {

    private final AssistenteReceitaService assistente;

    public AssistenteReceitaController(AssistenteReceitaService assistente) {
        this.assistente = assistente;
    }

    @PostMapping("/receitas")
    public Resposta perguntar(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody Pergunta pergunta) {
        return assistente.perguntar(pergunta, jwt.getSubject());
    }
}
