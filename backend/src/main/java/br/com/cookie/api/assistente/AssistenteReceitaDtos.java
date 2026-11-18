package br.com.cookie.api.assistente;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AssistenteReceitaDtos {

    private AssistenteReceitaDtos() {
    }

    public record ContextoReceita(
            @NotBlank @Size(max = 200) String titulo,
            @Size(max = 2000) String resumo,
            @Size(max = 30) List<@Size(max = 200) String> ingredientes,
            @Size(max = 30) List<@Size(max = 500) String> passos,
            Integer tempoPreparo,
            @Size(max = 100) String rendimento,
            @Size(max = 30) String dificuldade,
            @Size(max = 30) String custo) {
    }

    public record Mensagem(
            @NotBlank @Pattern(regexp = "user|assistant") String role,
            @NotBlank @Size(max = 2000) String texto) {
    }

    public record Pergunta(
            @NotBlank @Size(max = 500) String pergunta,
            @Valid ContextoReceita receita,
            @Size(max = 6) List<@Valid Mensagem> historico) {
    }

    public record Resposta(String resposta) {
    }
}
