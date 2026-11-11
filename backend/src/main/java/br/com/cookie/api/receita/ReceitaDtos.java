package br.com.cookie.api.receita;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import br.com.cookie.api.categoria.Categoria;
import br.com.cookie.api.usuario.UsuarioDtos.AutorResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/** Formatos de entrada e saída da API de receitas. */
public final class ReceitaDtos {

    private ReceitaDtos() {
    }

    // ---------- Entrada ----------

    public record IngredienteRequest(
            @NotBlank(message = "Informe o ingrediente.") @Size(max = 150) String nome,
            @DecimalMin(value = "0.001", message = "A quantidade precisa ser maior que zero.") @Digits(integer = 7, fraction = 3) BigDecimal quantidade,
            @Size(max = 50) String unidadeMedida,
            @Size(max = 200) String observacao) {
    }

    /** Receita publicada na plataforma. */
    public record ReceitaRequest(
            @NotBlank(message = "Dê um nome para a receita.") @Size(min = 3, max = 200, message = "Use de 3 a 200 caracteres.") String titulo,
            @Size(max = 2000) String resumo,
            @NotBlank(message = "Escolha uma categoria.") String categoria,
            @NotNull(message = "Informe o tempo em minutos.") @Positive(message = "Informe o tempo em minutos.") @Max(value = 10080, message = "O tempo máximo é de 7 dias.") Integer tempoPreparo,
            @Size(max = 100) String rendimento,
            Dificuldade dificuldade,
            @Size(max = 500) String fotoPrincipal,
            @NotNull(message = "Liste pelo menos 2 ingredientes.") @Size(min = 2, max = 100, message = "Liste de 2 a 100 ingredientes.") List<@Valid @NotNull IngredienteRequest> ingredientes,
            @NotNull(message = "Descreva pelo menos 1 passo.") @Size(min = 1, max = 100, message = "Descreva de 1 a 100 passos.") List<@NotBlank(message = "O passo não pode ficar vazio.") @Size(max = 2000) String> passos) {
    }

    /** Receita de outro site, indicada por link. */
    public record IndicacaoRequest(
            @NotBlank(message = "Cole o link da receita.") @Size(max = 1000) @Pattern(regexp = "^https?://\\S+$", message = "Cole um link completo, começando com https://") String urlFonte,
            @NotBlank(message = "Informe o nome da receita.") @Size(min = 3, max = 200, message = "Use de 3 a 200 caracteres.") String titulo,
            @NotBlank(message = "Escolha uma categoria.") String categoria,
            @Size(max = 2000) String motivo) {
    }

    // ---------- Saída ----------

    public record CategoriaResumo(String nome, String slug) {

        static CategoriaResumo de(Categoria c) {
            return new CategoriaResumo(c.getNome(), c.getSlug());
        }
    }

    public record EstatisticasResumo(int totalAvaliacoes, BigDecimal mediaGeral, BigDecimal taxaSucesso,
            boolean verificada) {

        public static EstatisticasResumo de(ReceitaEstatistica e) {
            return e == null ? new EstatisticasResumo(0, null, null, false)
                    : new EstatisticasResumo(e.getTotalAvaliacoes(), e.getMediaGeral(), e.getTaxaSucesso(),
                            Boolean.TRUE.equals(e.getVerificada()));
        }
    }

    public record Criterios(BigDecimal medidas, BigDecimal tempo, BigDecimal rendimento, BigDecimal clareza,
            BigDecimal resultado) {
    }

    public record EstatisticasDetalhe(int totalAvaliacoes, int totalSucesso, BigDecimal mediaGeral,
            BigDecimal taxaSucesso, boolean verificada, Criterios criterios) {

        static EstatisticasDetalhe de(ReceitaEstatistica e) {
            if (e == null) {
                return new EstatisticasDetalhe(0, 0, null, null, false, new Criterios(null, null, null, null, null));
            }
            return new EstatisticasDetalhe(e.getTotalAvaliacoes(), e.getTotalSucesso(), e.getMediaGeral(),
                    e.getTaxaSucesso(), Boolean.TRUE.equals(e.getVerificada()),
                    new Criterios(e.getMediaMedidas(), e.getMediaTempo(), e.getMediaRendimento(),
                            e.getMediaClareza(), e.getMediaResultado()));
        }
    }

    public record IngredienteResponse(int ordem, String ingrediente, BigDecimal quantidade, String unidadeMedida,
            String observacao) {
    }

    public record ReceitaResumo(Integer id, String titulo, String resumo, String fotoPrincipal, Integer tempoPreparo,
            String rendimento, Dificuldade dificuldade, Origem origem, String urlFonte, CategoriaResumo categoria,
            AutorResponse autor, Instant dataPublicacao, EstatisticasResumo estatisticas) {

        public static ReceitaResumo de(Receita r) {
            return new ReceitaResumo(r.getId(), r.getTitulo(), r.getResumo(), r.getFotoPrincipal(),
                    r.getTempoPreparo(), r.getRendimento(), r.getDificuldade(), r.getOrigem(), r.getUrlFonte(),
                    CategoriaResumo.de(r.getCategoria()), AutorResponse.de(r.getAutor()), r.getDataPublicacao(),
                    EstatisticasResumo.de(r.getEstatistica()));
        }
    }

    public record ReceitaDetalhe(Integer id, String titulo, String resumo, String fotoPrincipal, Integer tempoPreparo,
            String rendimento, Dificuldade dificuldade, Origem origem, String urlFonte, StatusReceita status,
            CategoriaResumo categoria, AutorResponse autor, Instant dataPublicacao,
            List<IngredienteResponse> ingredientes, List<String> passos, EstatisticasDetalhe estatisticas) {

        static ReceitaDetalhe de(Receita r) {
            var itens = r.getIngredientes();
            var ingredientes = new java.util.ArrayList<IngredienteResponse>(itens.size());
            for (int i = 0; i < itens.size(); i++) {
                var item = itens.get(i);
                ingredientes.add(new IngredienteResponse(i + 1, item.getIngrediente().getNome(), item.getQuantidade(),
                        item.getUnidadeMedida(), item.getObservacao()));
            }
            return new ReceitaDetalhe(r.getId(), r.getTitulo(), r.getResumo(), r.getFotoPrincipal(),
                    r.getTempoPreparo(), r.getRendimento(), r.getDificuldade(), r.getOrigem(), r.getUrlFonte(),
                    r.getStatus(), CategoriaResumo.de(r.getCategoria()), AutorResponse.de(r.getAutor()),
                    r.getDataPublicacao(), ingredientes, List.copyOf(r.getPassos()),
                    EstatisticasDetalhe.de(r.getEstatistica()));
        }
    }

    /** Receita na lista "minhas receitas", com a situação na curadoria. */
    public record MinhaReceita(Integer id, String titulo, Origem origem, StatusReceita status,
            String fotoPrincipal, CategoriaResumo categoria, Instant dataPublicacao, Instant dataModeracao,
            EstatisticasResumo estatisticas) {

        static MinhaReceita de(Receita r) {
            return new MinhaReceita(r.getId(), r.getTitulo(), r.getOrigem(), r.getStatus(), r.getFotoPrincipal(),
                    CategoriaResumo.de(r.getCategoria()), r.getDataPublicacao(), r.getDataModeracao(),
                    EstatisticasResumo.de(r.getEstatistica()));
        }
    }
}
