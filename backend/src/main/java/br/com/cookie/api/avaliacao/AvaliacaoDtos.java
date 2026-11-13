package br.com.cookie.api.avaliacao;

import java.time.Instant;

import br.com.cookie.api.receita.ReceitaDtos.EstatisticasResumo;
import br.com.cookie.api.usuario.UsuarioDtos.AutorResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class AvaliacaoDtos {

    private AvaliacaoDtos() {
    }

    public record Notas(
            @NotNull(message = "Dê uma nota para as medidas.") @Min(1) @Max(5) Integer medidas,
            @NotNull(message = "Dê uma nota para o tempo.") @Min(1) @Max(5) Integer tempo,
            @NotNull(message = "Dê uma nota para o rendimento.") @Min(1) @Max(5) Integer rendimento,
            @NotNull(message = "Dê uma nota para a clareza.") @Min(1) @Max(5) Integer clareza,
            @NotNull(message = "Dê uma nota para o resultado.") @Min(1) @Max(5) Integer resultado) {

        static Notas de(Avaliacao a) {
            return new Notas(a.getNotaMedidas().intValue(), a.getNotaTempo().intValue(),
                    a.getNotaRendimento().intValue(), a.getNotaClareza().intValue(), a.getNotaResultado().intValue());
        }
    }

    public record AvaliacaoRequest(
            @NotNull(message = "Conte se a receita deu certo.") Boolean funcionou,
            @NotNull(message = "Dê uma nota para todos os critérios.") @Valid Notas notas,
            @Size(max = 2000) String comentario,
            @Size(max = 500) String fotoResultado) {
    }

    public record AvaliacaoResponse(Integer idReceita, boolean funcionou, Notas notas, double media,
            Instant dataAvaliacao, EstatisticasResumo estatisticasDaReceita) {
    }

    public record AvaliacaoPublica(Long id, AutorResponse autor, boolean funcionou, Notas notas, double media,
            Instant dataAvaliacao) {

        static AvaliacaoPublica de(Avaliacao a) {
            return new AvaliacaoPublica(a.getId(), AutorResponse.de(a.getUsuario()), a.isFuncionou(), Notas.de(a),
                    a.media(), a.getDataAvaliacao());
        }
    }

    public record MinhaAvaliacao(Long id, Integer idReceita, String tituloReceita, String fotoReceita,
            boolean funcionou, Notas notas, double media, Instant dataAvaliacao) {

        static MinhaAvaliacao de(Avaliacao a) {
            var r = a.getReceita();
            return new MinhaAvaliacao(a.getId(), r.getId(), r.getTitulo(), r.getFotoPrincipal(), a.isFuncionou(),
                    Notas.de(a), a.media(), a.getDataAvaliacao());
        }
    }
}
