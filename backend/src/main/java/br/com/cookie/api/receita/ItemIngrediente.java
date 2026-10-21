package br.com.cookie.api.receita;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

/** Uma linha da tabela UTILIZA: quanto de qual ingrediente a receita usa. */
@Embeddable
public class ItemIngrediente {

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "id_ingrediente", nullable = false)
    private Ingrediente ingrediente;

    @Column(precision = 10, scale = 3)
    private BigDecimal quantidade;

    @Column(name = "unidade_medida", length = 50)
    private String unidadeMedida;

    @Column(length = 200)
    private String observacao;

    protected ItemIngrediente() {
    }

    public ItemIngrediente(Ingrediente ingrediente, BigDecimal quantidade, String unidadeMedida, String observacao) {
        this.ingrediente = ingrediente;
        this.quantidade = quantidade;
        this.unidadeMedida = unidadeMedida;
        this.observacao = observacao;
    }

    public Ingrediente getIngrediente() {
        return ingrediente;
    }

    public BigDecimal getQuantidade() {
        return quantidade;
    }

    public String getUnidadeMedida() {
        return unidadeMedida;
    }

    public String getObservacao() {
        return observacao;
    }
}
