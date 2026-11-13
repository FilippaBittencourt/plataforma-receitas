package br.com.cookie.api.receita;

import java.math.BigDecimal;

import org.hibernate.annotations.Immutable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Linha da view RECEITA_ESTATISTICA: médias, taxa de sucesso e selo de verificada. */
@Entity
@Immutable
@Table(name = "receita_estatistica")
public class ReceitaEstatistica {

    @Id
    @Column(name = "id_receita")
    private Integer idReceita;

    @Column(name = "total_avaliacoes")
    private Integer totalAvaliacoes;

    @Column(name = "total_sucesso")
    private Integer totalSucesso;

    @Column(name = "total_testadores")
    private Integer totalTestadores;

    @Column(name = "media_medidas")
    private BigDecimal mediaMedidas;

    @Column(name = "media_tempo")
    private BigDecimal mediaTempo;

    @Column(name = "media_rendimento")
    private BigDecimal mediaRendimento;

    @Column(name = "media_clareza")
    private BigDecimal mediaClareza;

    @Column(name = "media_resultado")
    private BigDecimal mediaResultado;

    @Column(name = "media_geral")
    private BigDecimal mediaGeral;

    /** Porcentagem de 0 a 100; nula enquanto não houver avaliações. */
    @Column(name = "taxa_sucesso")
    private BigDecimal taxaSucesso;

    @Column(name = "verificada")
    private Boolean verificada;

    protected ReceitaEstatistica() {
    }

    public Integer getIdReceita() {
        return idReceita;
    }

    public Integer getTotalAvaliacoes() {
        return totalAvaliacoes;
    }

    public Integer getTotalSucesso() {
        return totalSucesso;
    }

    public Integer getTotalTestadores() {
        return totalTestadores;
    }

    public BigDecimal getMediaMedidas() {
        return mediaMedidas;
    }

    public BigDecimal getMediaTempo() {
        return mediaTempo;
    }

    public BigDecimal getMediaRendimento() {
        return mediaRendimento;
    }

    public BigDecimal getMediaClareza() {
        return mediaClareza;
    }

    public BigDecimal getMediaResultado() {
        return mediaResultado;
    }

    public BigDecimal getMediaGeral() {
        return mediaGeral;
    }

    public BigDecimal getTaxaSucesso() {
        return taxaSucesso;
    }

    public Boolean getVerificada() {
        return verificada;
    }
}
