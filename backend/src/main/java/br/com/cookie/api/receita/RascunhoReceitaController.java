package br.com.cookie.api.receita;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.com.cookie.api.receita.RascunhoReceitaService.ConteudoRascunho;
import br.com.cookie.api.receita.RascunhoReceitaService.RascunhoDetalhe;
import br.com.cookie.api.receita.RascunhoReceitaService.RascunhoResumo;

@RestController
@RequestMapping("/api/rascunhos")
public class RascunhoReceitaController {

    private final RascunhoReceitaService rascunhos;
    public RascunhoReceitaController(RascunhoReceitaService rascunhos) { this.rascunhos = rascunhos; }

    @GetMapping
    List<RascunhoResumo> listar(@AuthenticationPrincipal Jwt jwt) { return rascunhos.listar(jwt); }

    @GetMapping("/{id}")
    RascunhoDetalhe obter(@AuthenticationPrincipal Jwt jwt, @PathVariable Integer id) { return rascunhos.obter(jwt, id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    RascunhoDetalhe criar(@AuthenticationPrincipal Jwt jwt, @RequestBody ConteudoRascunho conteudo) { return rascunhos.criar(jwt, conteudo); }

    @PutMapping("/{id}")
    RascunhoDetalhe atualizar(@AuthenticationPrincipal Jwt jwt, @PathVariable Integer id, @RequestBody ConteudoRascunho conteudo) { return rascunhos.atualizar(jwt, id, conteudo); }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void excluir(@AuthenticationPrincipal Jwt jwt, @PathVariable Integer id) { rascunhos.excluir(jwt, id); }
}
