package br.com.cookie.api.avaliacao;

import java.time.Instant;

import br.com.cookie.api.receita.Receita;
import br.com.cookie.api.usuario.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "avalia")
public class Avaliacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_avaliacao")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_receita", nullable = false)
    private Receita receita;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @Column(nullable = false)
    private boolean funcionou;

    @Column(name = "nota_medidas", nullable = false)
    private Short notaMedidas;

    @Column(name = "nota_tempo", nullable = false)
    private Short notaTempo;

    @Column(name = "nota_rendimento", nullable = false)
    private Short notaRendimento;

    @Column(name = "nota_clareza", nullable = false)
    private Short notaClareza;

    @Column(name = "nota_resultado", nullable = false)
    private Short notaResultado;

    @Column(name = "data_avaliacao", nullable = false)
    private Instant dataAvaliacao;

    protected Avaliacao() {
    }

    public Avaliacao(Receita receita, Usuario usuario) {
        this.receita = receita;
        this.usuario = usuario;
    }

    /** Grava (ou regrava) as notas; a data passa a ser a da última versão. */
    public void registrar(boolean funcionou, int medidas, int tempo, int rendimento, int clareza, int resultado) {
        this.funcionou = funcionou;
        this.notaMedidas = (short) medidas;
        this.notaTempo = (short) tempo;
        this.notaRendimento = (short) rendimento;
        this.notaClareza = (short) clareza;
        this.notaResultado = (short) resultado;
        this.dataAvaliacao = Instant.now();
    }

    public double media() {
        return (notaMedidas + notaTempo + notaRendimento + notaClareza + notaResultado) / 5.0;
    }

    public Long getId() {
        return id;
    }

    public Receita getReceita() {
        return receita;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public boolean isFuncionou() {
        return funcionou;
    }

    public Short getNotaMedidas() {
        return notaMedidas;
    }

    public Short getNotaTempo() {
        return notaTempo;
    }

    public Short getNotaRendimento() {
        return notaRendimento;
    }

    public Short getNotaClareza() {
        return notaClareza;
    }

    public Short getNotaResultado() {
        return notaResultado;
    }

    public Instant getDataAvaliacao() {
        return dataAvaliacao;
    }
}
