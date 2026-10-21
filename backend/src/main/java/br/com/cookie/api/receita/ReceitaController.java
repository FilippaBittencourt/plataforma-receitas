package br.com.cookie.api.receita;

import java.util.List;

import org.springframework.data.domain.PageRequest;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.com.cookie.api.comum.Pagina;
import br.com.cookie.api.receita.BuscaReceitas.Ordem;
import br.com.cookie.api.receita.ReceitaDtos.IndicacaoRequest;
import br.com.cookie.api.receita.ReceitaDtos.ReceitaDetalhe;
import br.com.cookie.api.receita.ReceitaDtos.ReceitaRequest;
import br.com.cookie.api.receita.ReceitaDtos.ReceitaResumo;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/receitas")
public class ReceitaController {

    private static final int TAMANHO_MAXIMO = 50;

    private final ReceitaService receitas;

    public ReceitaController(ReceitaService receitas) {
        this.receitas = receitas;
    }

    /**
     * Busca pública. Ex.: /api/receitas?q=bolo&categoria=doces&ingrediente=cenoura&verificadas=true&ordem=melhores
     * Ordens: recentes (padrão), melhores, mais-testadas.
     */
    @GetMapping
    Pagina<ReceitaResumo> buscar(@RequestParam(required = false) String q,
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) String ingrediente,
            @RequestParam(required = false) Origem origem,
            @RequestParam(defaultValue = "false") boolean verificadas,
            @RequestParam(required = false) String ordem,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "12") int tamanho) {
        var busca = new BuscaReceitas(q, categoria, ingrediente, origem, verificadas, 0, Ordem.de(ordem));
        return receitas.buscar(busca, paginacao(pagina, tamanho));
    }

    /** Ranking: só receitas com pelo menos uma avaliação; verificadas primeiro. */
    @GetMapping("/ranking")
    List<ReceitaResumo> ranking(@RequestParam(required = false) String categoria,
            @RequestParam(defaultValue = "20") int limite) {
        var busca = new BuscaReceitas(null, categoria, null, null, false, 1, Ordem.RANKING);
        return receitas.buscar(busca, paginacao(0, limite)).itens();
    }

    @GetMapping("/{id}")
    ReceitaDetalhe detalhe(@PathVariable Integer id, @AuthenticationPrincipal Jwt jwt) {
        return receitas.detalhe(id, jwt);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    ReceitaDetalhe criar(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ReceitaRequest req) {
        return receitas.criar(jwt, req);
    }

    @PostMapping("/indicacoes")
    @ResponseStatus(HttpStatus.CREATED)
    ReceitaDetalhe indicar(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody IndicacaoRequest req) {
        return receitas.indicar(jwt, req);
    }

    @PutMapping("/{id}")
    ReceitaDetalhe atualizar(@AuthenticationPrincipal Jwt jwt, @PathVariable Integer id,
            @Valid @RequestBody ReceitaRequest req) {
        return receitas.atualizar(jwt, id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void excluir(@AuthenticationPrincipal Jwt jwt, @PathVariable Integer id) {
        receitas.excluir(jwt, id);
    }

    private static PageRequest paginacao(int pagina, int tamanho) {
        return PageRequest.of(Math.max(pagina, 0), Math.clamp(tamanho, 1, TAMANHO_MAXIMO));
    }
}
