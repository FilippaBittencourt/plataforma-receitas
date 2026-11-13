package br.com.cookie.api.comentario;

import java.time.Instant;

import br.com.cookie.api.usuario.UsuarioDtos.AutorResponse;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class ComentarioDtos {

    private ComentarioDtos() {
    }

    public record ComentarioRequest(
            @NotBlank(message = "Escreva o comentário.") @Size(max = 2000, message = "Use até 2000 caracteres.") String texto,
            @Size(max = 500) String fotoResultado) {
    }

    public record ComentarioResponse(Integer id, String texto, String fotoResultado, Instant dataComentario,
            AutorResponse autor, NotaAvaliacao avaliacao) {

        static ComentarioResponse de(Comentario c) {
            return new ComentarioResponse(c.getId(), c.getTexto(), c.getFotoResultado(), c.getDataComentario(),
                    AutorResponse.de(c.getAutor()), c.getAvaliacao() == null ? null
                            : new NotaAvaliacao(c.getAvaliacao().media(), c.getAvaliacao().isFuncionou()));
        }
    }

    public record NotaAvaliacao(double media, boolean funcionou) {
    }

    public record FotoComunidadeResponse(Integer id, String fotoResultado, Instant dataComentario,
            AutorResponse autor) {

        static FotoComunidadeResponse de(Comentario c) {
            return new FotoComunidadeResponse(c.getId(), c.getFotoResultado(), c.getDataComentario(),
                    AutorResponse.de(c.getAutor()));
        }
    }
}
