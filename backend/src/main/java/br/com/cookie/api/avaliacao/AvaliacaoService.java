package br.com.cookie.api.avaliacao;

import java.util.List;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.cookie.api.avaliacao.AvaliacaoDtos.AvaliacaoRequest;
import br.com.cookie.api.avaliacao.AvaliacaoDtos.AvaliacaoResponse;
import br.com.cookie.api.avaliacao.AvaliacaoDtos.MinhaAvaliacao;
import br.com.cookie.api.avaliacao.AvaliacaoDtos.Notas;
import br.com.cookie.api.comentario.Comentario;
import br.com.cookie.api.comentario.ComentarioRepository;
import br.com.cookie.api.comum.ApiException;
import br.com.cookie.api.receita.ReceitaDtos.EstatisticasResumo;
import br.com.cookie.api.receita.ReceitaEstatisticaRepository;
import br.com.cookie.api.receita.ReceitaService;
import br.com.cookie.api.usuario.Usuario;
import br.com.cookie.api.usuario.UsuarioService;
import br.com.cookie.api.email.EmailNotificacaoService.Atividade;
import jakarta.persistence.EntityManager;

@Service
public class AvaliacaoService {

    private final AvaliacaoRepository avaliacoes;
    private final ComentarioRepository comentarios;
    private final ReceitaEstatisticaRepository estatisticas;
    private final ReceitaService receitas;
    private final UsuarioService usuarios;
    private final EntityManager em;
    private final ApplicationEventPublisher eventos;

    public AvaliacaoService(AvaliacaoRepository avaliacoes, ComentarioRepository comentarios,
            ReceitaEstatisticaRepository estatisticas, ReceitaService receitas, UsuarioService usuarios,
            EntityManager em, ApplicationEventPublisher eventos) {
        this.avaliacoes = avaliacoes;
        this.comentarios = comentarios;
        this.estatisticas = estatisticas;
        this.receitas = receitas;
        this.usuarios = usuarios;
        this.em = em;
        this.eventos = eventos;
    }

    public record Resultado(AvaliacaoResponse avaliacao, boolean criada) {
    }

    /** Cria ou atualiza a avaliação da pessoa (a chave composta garante uma por receita). */
    @Transactional
    public Resultado avaliar(Jwt jwt, Integer idReceita, AvaliacaoRequest req) {
        Usuario usuario = usuarios.ativo(jwt);
        var receita = receitas.aprovada(idReceita);
        if (receita.isDoAutor(usuario)) {
            throw ApiException.proibido("Você não pode avaliar a própria receita.");
        }
        var id = new AvaliacaoId(receita.getId(), usuario.getId());
        var existente = avaliacoes.findById(id);
        Avaliacao avaliacao = existente.orElseGet(() -> new Avaliacao(receita, usuario));
        Notas n = req.notas();
        avaliacao.registrar(req.funcionou(), n.medidas(), n.tempo(), n.rendimento(), n.clareza(), n.resultado());
        avaliacoes.save(avaliacao);

        boolean temComentario = req.comentario() != null && !req.comentario().isBlank();
        boolean temFoto = req.fotoResultado() != null && !req.fotoResultado().isBlank();
        if (temComentario || temFoto) {
            String texto = temComentario ? req.comentario().trim() : "Enviou uma foto do resultado.";
            comentarios.save(new Comentario(receita, usuario, texto, temFoto ? req.fotoResultado().trim() : null));
        }

        // A view é recalculada pelo banco: grava a avaliação e relê a linha, porque a sessão
        // pode já ter carregado a versão anterior junto com a receita.
        em.flush();
        var stats = estatisticas.findById(receita.getId())
                .map(e -> {
                    em.refresh(e);
                    return EstatisticasResumo.de(e);
                })
                .orElseGet(() -> EstatisticasResumo.de(null));
        Usuario autor = receita.getAutor();
        if (existente.isEmpty() && autor != null && !autor.getId().equals(usuario.getId()) && autor.isNotifAvaliacoes()) {
            eventos.publishEvent(new Atividade(autor.getEmail(), autor.getNome(), usuario.getNome(), receita.getTitulo(), receita.getId(), "avaliacao"));
        }
        var resposta = new AvaliacaoResponse(receita.getId(), avaliacao.isFuncionou(), Notas.de(avaliacao),
                avaliacao.media(), avaliacao.getDataAvaliacao(), stats);
        return new Resultado(resposta, existente.isEmpty());
    }

    @Transactional(readOnly = true)
    public AvaliacaoResponse minha(Jwt jwt, Integer idReceita) {
        Usuario usuario = usuarios.logado(jwt);
        var avaliacao = avaliacoes.findById(new AvaliacaoId(idReceita, usuario.getId()))
                .orElseThrow(() -> ApiException.naoEncontrado("Você ainda não avaliou esta receita."));
        var stats = estatisticas.findById(idReceita).map(EstatisticasResumo::de)
                .orElseGet(() -> EstatisticasResumo.de(null));
        return new AvaliacaoResponse(idReceita, avaliacao.isFuncionou(), Notas.de(avaliacao), avaliacao.media(),
                avaliacao.getDataAvaliacao(), stats);
    }

    @Transactional
    public void remover(Jwt jwt, Integer idReceita) {
        Usuario usuario = usuarios.logado(jwt);
        var id = new AvaliacaoId(idReceita, usuario.getId());
        if (!avaliacoes.existsById(id)) {
            throw ApiException.naoEncontrado("Você ainda não avaliou esta receita.");
        }
        avaliacoes.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<MinhaAvaliacao> minhas(Usuario usuario) {
        return avaliacoes.findByUsuarioIdOrderByDataAvaliacaoDesc(usuario.getId()).stream().map(MinhaAvaliacao::de)
                .toList();
    }
}
