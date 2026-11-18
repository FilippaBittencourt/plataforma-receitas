package br.com.cookie.api.moderacao;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.cookie.api.comentario.Comentario;
import br.com.cookie.api.comentario.ComentarioRepository;
import br.com.cookie.api.comentario.StatusComentario;
import br.com.cookie.api.comum.ApiException;
import br.com.cookie.api.moderacao.ModeracaoDtos.DenunciaRequest;
import br.com.cookie.api.moderacao.ModeracaoDtos.DenunciaResponse;
import br.com.cookie.api.moderacao.ModeracaoDtos.ReceitaNaFila;
import br.com.cookie.api.moderacao.ModeracaoDtos.ResumoModeracao;
import br.com.cookie.api.moderacao.ModeracaoDtos.UsuarioDenunciado;
import br.com.cookie.api.moderacao.ModeracaoDtos.UsuarioGestao;
import br.com.cookie.api.receita.Receita;
import br.com.cookie.api.receita.ReceitaDtos.CategoriaResumo;
import br.com.cookie.api.receita.ReceitaRepository;
import br.com.cookie.api.receita.StatusReceita;
import br.com.cookie.api.usuario.StatusUsuario;
import br.com.cookie.api.usuario.Usuario;
import br.com.cookie.api.usuario.UsuarioDtos.AutorResponse;
import br.com.cookie.api.usuario.UsuarioRepository;
import br.com.cookie.api.usuario.UsuarioService;

@Service
public class ModeracaoService {

    /** "Hoje" no painel segue o horário de Brasília. */
    private static final ZoneId FUSO = ZoneId.of("America/Sao_Paulo");

    private final ReceitaRepository receitas;
    private final ComentarioRepository comentarios;
    private final DenunciaRepository denuncias;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioService usuarios;

    public ModeracaoService(ReceitaRepository receitas, ComentarioRepository comentarios,
            DenunciaRepository denuncias, UsuarioRepository usuarioRepository, UsuarioService usuarios) {
        this.receitas = receitas;
        this.comentarios = comentarios;
        this.denuncias = denuncias;
        this.usuarioRepository = usuarioRepository;
        this.usuarios = usuarios;
    }

    // ---------- Qualquer usuário ----------

    @Transactional
    public DenunciaResponse denunciar(Jwt jwt, DenunciaRequest req) {
        Usuario denunciante = usuarios.ativo(jwt);
        Comentario comentario = null;
        Usuario denunciado;
        if (req.idComentario() != null) {
            comentario = comentarios.findById(req.idComentario())
                    .orElseThrow(() -> ApiException.naoEncontrado("Comentário não encontrado."));
            denunciado = comentario.getAutor();
        } else if (req.nomeUsuario() != null && !req.nomeUsuario().isBlank()) {
            denunciado = usuarioRepository.findByNomeUsuario(UsuarioService.normalizarNomeUsuario(req.nomeUsuario()))
                    .orElseThrow(() -> ApiException.naoEncontrado("Usuário não encontrado."));
        } else {
            throw ApiException.invalido("Informe o usuário ou o comentário denunciado.");
        }
        if (denunciado.getId().equals(denunciante.getId())) {
            throw ApiException.invalido("Você não pode denunciar a si mesmo.");
        }
        return resposta(denuncias.save(new Denuncia(denunciante, denunciado, comentario, req.motivo().trim())));
    }

    // ---------- Moderação ----------

    @Transactional(readOnly = true)
    public ResumoModeracao resumo() {
        var inicioDoDia = LocalDate.now(FUSO).atStartOfDay(FUSO).toInstant();
        return new ResumoModeracao(receitas.countByStatus(StatusReceita.PENDENTE),
                receitas.countByStatusAndDataModeracaoGreaterThanEqual(StatusReceita.APROVADA, inicioDoDia),
                receitas.countByStatusAndDataModeracaoGreaterThanEqual(StatusReceita.RECUSADA, inicioDoDia),
                denuncias.countByStatus(StatusDenuncia.ABERTA));
    }

    /** Fila de curadoria: as mais antigas primeiro. */
    @Transactional(readOnly = true)
    public br.com.cookie.api.comum.Pagina<ReceitaNaFila> fila(Pageable pageable) {
        return br.com.cookie.api.comum.Pagina.de(
                receitas.findByStatusOrderByDataPublicacaoAsc(StatusReceita.PENDENTE, pageable),
                r -> new ReceitaNaFila(r.getId(), r.getTitulo(), r.getOrigem(), r.getUrlFonte(),
                        new CategoriaResumo(r.getCategoria().getNome(), r.getCategoria().getSlug()),
                        AutorResponse.de(r.getAutor()), r.getDataPublicacao()));
    }

    @Transactional
    public void moderarReceita(Integer id, StatusReceita decisao) {
        Receita receita = receitas.findById(id).orElseThrow(() -> ApiException.naoEncontrado("Receita não encontrada."));
        receita.moderar(decisao);
    }

    @Transactional
    public void mudarStatusComentario(Integer id, StatusComentario status) {
        comentarios.findById(id).orElseThrow(() -> ApiException.naoEncontrado("Comentário não encontrado."))
                .setStatus(status);
    }

    @Transactional(readOnly = true)
    public br.com.cookie.api.comum.Pagina<DenunciaResponse> denunciasAbertas(Pageable pageable) {
        return br.com.cookie.api.comum.Pagina.de(
                denuncias.findByStatusOrderByDataDenunciaDesc(StatusDenuncia.ABERTA, pageable), this::resposta);
    }

    @Transactional
    public void resolverDenuncia(Integer id, boolean ocultarComentario) {
        Denuncia denuncia = denuncias.findById(id)
                .orElseThrow(() -> ApiException.naoEncontrado("Denúncia não encontrada."));
        if (ocultarComentario && denuncia.getComentario() != null) {
            denuncia.getComentario().setStatus(StatusComentario.OCULTO);
        }
        denuncia.setStatus(StatusDenuncia.RESOLVIDA);
    }

    /** Usuários com denúncias abertas, do mais denunciado para o menos. */
    @Transactional(readOnly = true)
    public br.com.cookie.api.comum.Pagina<UsuarioDenunciado> usuariosDenunciados(Pageable pageable) {
        var page = denuncias.usuariosComDenuncias(pageable).map(u -> new UsuarioDenunciado(
                u.getId(), u.getNome(), u.getNomeUsuario(), StatusUsuario.valueOf(u.getStatus()),
                u.getDenunciasAbertas(), u.getUltimoMotivo()));
        return br.com.cookie.api.comum.Pagina.de(page, java.util.function.Function.identity());
    }

    @Transactional(readOnly = true)
    public br.com.cookie.api.comum.Pagina<UsuarioGestao> usuariosParaGestao(String termo, Pageable pageable) {
        String busca = termo == null ? "" : termo.trim().toLowerCase(java.util.Locale.ROOT);
        return br.com.cookie.api.comum.Pagina.de(
                usuarioRepository.buscarParaGestao(busca, pageable),
                u -> new UsuarioGestao(u.getId(), u.getNome(), u.getNomeUsuario(), u.getEmail(),
                        u.getStatus(), u.getTipo(), u.getDataCadastro()));
    }

    @Transactional
    public void mudarStatusUsuario(Jwt jwt, Integer id, StatusUsuario status) {
        Usuario moderador = usuarios.logado(jwt);
        Usuario alvo = usuarioRepository.findById(id)
                .orElseThrow(() -> ApiException.naoEncontrado("Usuário não encontrado."));
        if (alvo.getId().equals(moderador.getId())) {
            throw ApiException.invalido("Você não pode suspender a própria conta.");
        }
        if (status == StatusUsuario.SUSPENSO && alvo.isAdministrador()) {
            throw ApiException.proibido("Contas da moderação não podem ser suspensas.");
        }
        alvo.setStatus(status);
    }

    private DenunciaResponse resposta(Denuncia d) {
        String trecho = d.getComentario() == null ? null : resumir(d.getComentario().getTexto());
        AutorResponse denunciante = d.getDenunciante() == null
                ? new AutorResponse(null, d.getNomeDenunciante(), d.getNomeUsuarioDenunciante(), null)
                : AutorResponse.de(d.getDenunciante());
        AutorResponse denunciado = d.getDenunciado() == null
                ? new AutorResponse(null, d.getNomeDenunciado(), d.getNomeUsuarioDenunciado(), null)
                : AutorResponse.de(d.getDenunciado());
        return new DenunciaResponse(d.getId(), denunciante, denunciado,
                d.getComentario() == null ? null : d.getComentario().getId(),
                trecho, d.getMotivo(), d.getStatus(), d.getDataDenuncia());
    }

    private static String resumir(String texto) {
        return texto.length() <= 140 ? texto : texto.substring(0, 137) + "...";
    }
}
