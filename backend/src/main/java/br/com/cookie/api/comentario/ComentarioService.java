package br.com.cookie.api.comentario;

import org.springframework.data.domain.Pageable;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.cookie.api.comentario.ComentarioDtos.ComentarioRequest;
import br.com.cookie.api.comentario.ComentarioDtos.ComentarioResponse;
import br.com.cookie.api.comum.ApiException;
import br.com.cookie.api.comum.Pagina;
import br.com.cookie.api.receita.ReceitaService;
import br.com.cookie.api.usuario.Usuario;
import br.com.cookie.api.usuario.UsuarioService;

@Service
public class ComentarioService {

    private final ComentarioRepository comentarios;
    private final ReceitaService receitas;
    private final UsuarioService usuarios;

    public ComentarioService(ComentarioRepository comentarios, ReceitaService receitas, UsuarioService usuarios) {
        this.comentarios = comentarios;
        this.receitas = receitas;
        this.usuarios = usuarios;
    }

    @Transactional(readOnly = true)
    public Pagina<ComentarioResponse> listar(Integer idReceita, Pageable pagina) {
        receitas.aprovada(idReceita);
        return Pagina.de(comentarios.findByReceitaIdAndStatusOrderByDataComentarioDesc(idReceita,
                StatusComentario.VISIVEL, pagina), ComentarioResponse::de);
    }

    @Transactional
    public ComentarioResponse comentar(Jwt jwt, Integer idReceita, ComentarioRequest req) {
        Usuario usuario = usuarios.ativo(jwt);
        var receita = receitas.aprovada(idReceita);
        String foto = req.fotoResultado() == null || req.fotoResultado().isBlank() ? null : req.fotoResultado().trim();
        return ComentarioResponse.de(comentarios.save(new Comentario(receita, usuario, req.texto().trim(), foto)));
    }

    /** O autor apaga o próprio comentário; a moderação apaga qualquer um. */
    @Transactional
    public void excluir(Jwt jwt, Integer idComentario) {
        Usuario usuario = usuarios.logado(jwt);
        var comentario = comentarios.findById(idComentario)
                .orElseThrow(() -> ApiException.naoEncontrado("Comentário não encontrado."));
        if (!(comentario.getAutor().getId().equals(usuario.getId()) || usuario.isAdministrador())) {
            throw ApiException.proibido("Só o autor ou a moderação pode excluir o comentário.");
        }
        comentarios.delete(comentario);
    }
}
