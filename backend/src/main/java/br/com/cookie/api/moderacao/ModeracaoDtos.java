package br.com.cookie.api.moderacao;

import java.time.Instant;

import br.com.cookie.api.receita.Origem;
import br.com.cookie.api.receita.ReceitaDtos.CategoriaResumo;
import br.com.cookie.api.usuario.StatusUsuario;
import br.com.cookie.api.usuario.UsuarioDtos.AutorResponse;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class ModeracaoDtos {

    private ModeracaoDtos() {
    }

    /** Denúncia contra um usuário (pelo nome de usuário) ou contra um comentário. */
    public record DenunciaRequest(
            String nomeUsuario,
            Integer idComentario,
            @NotBlank(message = "Conte o motivo da denúncia.") @Size(max = 500, message = "Use até 500 caracteres.") String motivo) {
    }

    public record DenunciaResponse(Integer id, AutorResponse denunciante, AutorResponse denunciado,
            Integer idComentario, String trechoComentario, String motivo, StatusDenuncia status,
            Instant dataDenuncia) {
    }

    public record ResumoModeracao(long receitasPendentes, long aprovadasHoje, long recusadasHoje,
            long denunciasAbertas) {
    }

    public record ReceitaNaFila(Integer id, String titulo, Origem origem, String urlFonte, CategoriaResumo categoria,
            AutorResponse autor, Instant dataPublicacao) {
    }

    public record UsuarioDenunciado(Integer id, String nome, String nomeUsuario, StatusUsuario status,
            long denunciasAbertas, String ultimoMotivo) {
    }
}
