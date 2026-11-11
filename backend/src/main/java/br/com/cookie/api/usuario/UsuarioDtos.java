package br.com.cookie.api.usuario;

import java.time.Instant;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Formatos de entrada e saída da API de usuários. */
public final class UsuarioDtos {

    private UsuarioDtos() {
    }

    public record CadastroRequest(
            @NotBlank(message = "Informe seu nome.") @Size(min = 2, max = 150, message = "Use de 2 a 150 caracteres.") String nome,
            @NotBlank(message = "Informe um e-mail.") @Email(message = "Informe um e-mail válido.") @Size(max = 150) String email,
            @NotBlank(message = "Informe uma senha.") @Size(min = 8, max = 72, message = "A senha precisa ter de 8 a 72 caracteres.") String senha,
            @Pattern(regexp = "^@?[A-Za-z0-9_.]{3,30}$", message = "Use de 3 a 30 letras, números, ponto ou sublinhado.") String nomeUsuario) {
    }

    public record LoginRequest(
            @NotBlank(message = "Informe o e-mail.") String email,
            @NotBlank(message = "Informe a senha.") String senha) {
    }

    public record RedefinirSenhaRequest(
            @NotBlank(message = "Informe o e-mail da conta.") @Email(message = "Informe um e-mail válido.") @Size(max = 150) String email,
            @NotBlank(message = "Informe seu código de recuperação.") @Size(max = 40) String codigoRecuperacao,
            @NotBlank(message = "Informe a nova senha.") @Size(min = 8, max = 72, message = "A senha precisa ter de 8 a 72 caracteres.") String novaSenha) {
    }

    public record CodigoRecuperacaoResponse(String codigoRecuperacao) {}

    public record AtualizarPerfilRequest(
            @NotBlank(message = "Informe seu nome.") @Size(min = 2, max = 150, message = "Use de 2 a 150 caracteres.") String nome,
            @NotBlank(message = "Informe o nome de usuário.") @Pattern(regexp = "^@?[A-Za-z0-9_.]{3,30}$", message = "Use de 3 a 30 letras, números, ponto ou sublinhado.") String nomeUsuario,
            @Size(max = 160, message = "A bio pode ter até 160 caracteres.") String bio,
            @Size(max = 500) String fotoPerfil) {
    }

    public record AlterarEmailRequest(
            @NotBlank(message = "Informe um e-mail.") @Email(message = "Informe um e-mail válido.") @Size(max = 150) String email) {
    }

    public record AlterarSenhaRequest(
            @NotBlank(message = "Informe sua senha atual.") String senhaAtual,
            @NotBlank(message = "Informe a nova senha.") @Size(min = 8, max = 72, message = "A senha precisa ter de 8 a 72 caracteres.") String novaSenha) {
    }

    public record Notificacoes(@NotNull Boolean avaliacoes, @NotNull Boolean comentarios, @NotNull Boolean novidades) {

        static Notificacoes de(Usuario u) {
            return new Notificacoes(u.isNotifAvaliacoes(), u.isNotifComentarios(), u.isNotifNovidades());
        }
    }

    public record Estatisticas(long receitasPublicadas, long avaliacoes) {
    }

    /** Dados que só a própria pessoa vê. */
    public record PerfilResponse(Integer id, String nome, String nomeUsuario, String email, String bio,
            String fotoPerfil, TipoUsuario tipo, StatusUsuario status, Instant dataCadastro,
            @Valid Notificacoes notificacoes, Estatisticas estatisticas) {
    }

    /** Dados exibidos no perfil público. */
    public record PerfilPublicoResponse(Integer id, String nome, String nomeUsuario, String bio, String fotoPerfil,
            boolean moderador, Instant dataCadastro, Estatisticas estatisticas) {
    }

    /** Autor resumido, usado em receitas e comentários. Nulo quando a conta foi excluída. */
    public record AutorResponse(Integer id, String nome, String nomeUsuario, String fotoPerfil) {

        public static AutorResponse de(Usuario u) {
            return u == null ? null : new AutorResponse(u.getId(), u.getNome(), u.getNomeUsuario(), u.getFotoPerfil());
        }
    }

    public record TokenResponse(String token, Instant expiraEm, PerfilResponse usuario, String codigoRecuperacao) {
    }
}
