package br.com.cookie.api.comentario;

import java.time.Instant;

import br.com.cookie.api.avaliacao.Avaliacao;
import br.com.cookie.api.receita.Receita;
import br.com.cookie.api.usuario.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "comenta")
public class Comentario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_comentario")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_receita", nullable = false)
    private Receita receita;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario autor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_avaliacao")
    private Avaliacao avaliacao;

    @Column(name = "foto_resultado", length = 500)
    private String fotoResultado;

    @Column(name = "data_comentario", nullable = false, updatable = false)
    private Instant dataComentario;

    @Column(nullable = false, columnDefinition = "text")
    private String texto;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusComentario status = StatusComentario.VISIVEL;

    protected Comentario() {
    }

    public Comentario(Receita receita, Usuario autor, String texto, String fotoResultado) {
        this.receita = receita;
        this.autor = autor;
        this.texto = texto;
        this.fotoResultado = fotoResultado;
    }

    public Comentario(Receita receita, Usuario autor, String texto, String fotoResultado, Avaliacao avaliacao) {
        this(receita, autor, texto, fotoResultado);
        this.avaliacao = avaliacao;
    }

    @PrePersist
    void aoCriar() {
        if (dataComentario == null) {
            dataComentario = Instant.now();
        }
    }

    public Integer getId() {
        return id;
    }

    public Receita getReceita() {
        return receita;
    }

    public Usuario getAutor() {
        return autor;
    }

    public Avaliacao getAvaliacao() {
        return avaliacao;
    }

    public String getFotoResultado() {
        return fotoResultado;
    }

    public Instant getDataComentario() {
        return dataComentario;
    }

    public String getTexto() {
        return texto;
    }

    public StatusComentario getStatus() {
        return status;
    }

    public void setStatus(StatusComentario status) {
        this.status = status;
    }
}
