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
            AutorResponse autor) {

        static ComentarioResponse de(Comentario c) {
            return new ComentarioResponse(c.getId(), c.getTexto(), c.getFotoResultado(), c.getDataComentario(),
                    AutorResponse.de(c.getAutor()));
        }
    }
}
