package br.com.cookie.api.receita;

import java.net.URI;
import java.util.List;
import java.util.Locale;

import org.springframework.data.domain.Pageable;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.cookie.api.categoria.Categoria;
import br.com.cookie.api.categoria.CategoriaRepository;
import br.com.cookie.api.comum.ApiException;
import br.com.cookie.api.comum.Pagina;
import br.com.cookie.api.receita.ReceitaDtos.IndicacaoRequest;
import br.com.cookie.api.receita.ReceitaDtos.IngredienteRequest;
import br.com.cookie.api.receita.ReceitaDtos.MinhaReceita;
import br.com.cookie.api.receita.ReceitaDtos.ReceitaDetalhe;
import br.com.cookie.api.receita.ReceitaDtos.ReceitaRequest;
import br.com.cookie.api.receita.ReceitaDtos.ReceitaResumo;
import br.com.cookie.api.usuario.Usuario;
import br.com.cookie.api.usuario.UsuarioService;

@Service
public class ReceitaService {

    private final ReceitaRepository receitas;
    private final CategoriaRepository categorias;
    private final IngredienteRepository ingredientes;
    private final UsuarioService usuarios;

    public ReceitaService(ReceitaRepository receitas, CategoriaRepository categorias,
            IngredienteRepository ingredientes, UsuarioService usuarios) {
        this.receitas = receitas;
        this.categorias = categorias;
        this.ingredientes = ingredientes;
        this.usuarios = usuarios;
    }

    @Transactional(readOnly = true)
    public Pagina<ReceitaResumo> buscar(BuscaReceitas busca, Pageable pagina) {
        return Pagina.de(receitas.findAll(busca.especificacao(), pagina), ReceitaResumo::de);
    }

    /**
     * Receitas aprovadas ficam visíveis para todos. Pendentes e recusadas, só para o autor e a moderação;
     * para os demais a resposta é 404, sem revelar que a receita existe.
     */
    @Transactional(readOnly = true)
    public ReceitaDetalhe detalhe(Integer id, Jwt jwt) {
        Receita receita = receitas.findById(id).orElseThrow(ReceitaService::naoEncontrada);
        if (receita.getStatus() != StatusReceita.APROVADA) {
            Usuario usuario = jwt == null ? null : usuarios.logado(jwt);
            if (usuario == null || !(receita.isDoAutor(usuario) || usuario.isAdministrador())) {
                throw naoEncontrada();
            }
        }
        return ReceitaDetalhe.de(receita);
    }

    /** Receita aprovada, a única que pode receber avaliações e comentários. */
    @Transactional(readOnly = true)
    public Receita aprovada(Integer id) {
        return receitas.findById(id)
                .filter(r -> r.getStatus() == StatusReceita.APROVADA)
                .orElseThrow(ReceitaService::naoEncontrada);
    }

    @Transactional
    public ReceitaDetalhe criar(Jwt jwt, ReceitaRequest req) {
        var receita = new Receita(Origem.PROPRIA, usuarios.ativo(jwt));
        preencher(receita, req);
        return ReceitaDetalhe.de(receitas.save(receita));
    }

    @Transactional
    public ReceitaDetalhe indicar(Jwt jwt, IndicacaoRequest req) {
        String url = validarLink(req.urlFonte());
        var receita = new Receita(Origem.EXTERNA, usuarios.ativo(jwt));
        receita.setUrlFonte(url);
        receita.setTitulo(req.titulo().trim());
        receita.setResumo(vazioParaNulo(req.motivo()));
        receita.setCategoria(categoria(req.categoria()));
        return ReceitaDetalhe.de(receitas.save(receita));
    }

    /** Só o autor edita, e a receita editada volta para a curadoria. */
    @Transactional
    public ReceitaDetalhe atualizar(Jwt jwt, Integer id, ReceitaRequest req) {
        Usuario usuario = usuarios.ativo(jwt);
        Receita receita = receitas.findById(id).orElseThrow(ReceitaService::naoEncontrada);
        if (!receita.isDoAutor(usuario)) {
            throw ApiException.proibido("Só quem publicou pode editar a receita.");
        }
        if (receita.getOrigem() != Origem.PROPRIA) {
            throw ApiException.invalido("Receitas indicadas por link não podem ser editadas; envie uma nova indicação.");
        }
        preencher(receita, req);
        receita.voltarParaCuradoria();
        return ReceitaDetalhe.de(receitas.save(receita));
    }

    @Transactional
    public void excluir(Jwt jwt, Integer id) {
        Usuario usuario = usuarios.logado(jwt);
        Receita receita = receitas.findById(id).orElseThrow(ReceitaService::naoEncontrada);
        if (!(receita.isDoAutor(usuario) || usuario.isAdministrador())) {
            throw ApiException.proibido("Só quem publicou ou a moderação pode excluir a receita.");
        }
        receitas.delete(receita);
    }

    @Transactional(readOnly = true)
    public List<ReceitaResumo> publicadasPor(Integer idUsuario) {
        return receitas.findByAutorIdAndStatusOrderByDataPublicacaoDesc(idUsuario, StatusReceita.APROVADA).stream()
                .map(ReceitaResumo::de).toList();
    }

    @Transactional(readOnly = true)
    public List<MinhaReceita> minhas(Usuario usuario) {
        return receitas.findByAutorIdOrderByDataPublicacaoDesc(usuario.getId()).stream().map(MinhaReceita::de)
                .toList();
    }

    private void preencher(Receita receita, ReceitaRequest req) {
        receita.setTitulo(req.titulo().trim());
        receita.setResumo(vazioParaNulo(req.resumo()));
        receita.setCategoria(categoria(req.categoria()));
        receita.setTempoPreparo(req.tempoPreparo());
        receita.setRendimento(vazioParaNulo(req.rendimento()));
        receita.setDificuldade(req.dificuldade());
        receita.setFotoPrincipal(vazioParaNulo(req.fotoPrincipal()));

        receita.getIngredientes().clear();
        for (IngredienteRequest item : req.ingredientes()) {
            receita.getIngredientes().add(new ItemIngrediente(ingrediente(item.nome()), item.quantidade(),
                    vazioParaNulo(item.unidadeMedida()), vazioParaNulo(item.observacao())));
        }
        receita.getPassos().clear();
        req.passos().forEach(passo -> receita.getPassos().add(passo.trim()));
    }

    private Categoria categoria(String slug) {
        return categorias.findBySlug(slug.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> ApiException.invalido("Categoria inexistente: " + slug));
    }

    /** Busca o ingrediente pelo nome normalizado; se for novo, cadastra. */
    private Ingrediente ingrediente(String nome) {
        String normalizado = nome.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
        return ingredientes.findByNome(normalizado).orElseGet(() -> ingredientes.save(new Ingrediente(normalizado)));
    }

    private static String validarLink(String valor) {
        try {
            URI uri = URI.create(valor.trim());
            if (uri.getHost() == null || !("http".equals(uri.getScheme()) || "https".equals(uri.getScheme()))) {
                throw new IllegalArgumentException();
            }
            return uri.toString();
        } catch (IllegalArgumentException e) {
            throw ApiException.invalido("Cole um link completo, começando com https://");
        }
    }

    private static ApiException naoEncontrada() {
        return ApiException.naoEncontrado("Receita não encontrada.");
    }

    private static String vazioParaNulo(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}
