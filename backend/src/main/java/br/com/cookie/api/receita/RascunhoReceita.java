package br.com.cookie.api.receita;

import java.time.Instant;

import br.com.cookie.api.usuario.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "rascunho_receita")
public class RascunhoReceita {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_rascunho")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario autor;

    @Column(nullable = false, length = 200)
    private String titulo = "";

    @Column(nullable = false, columnDefinition = "text")
    private String conteudo;

    @Column(name = "atualizado_em", nullable = false)
    private Instant atualizadoEm;

    protected RascunhoReceita() {}

    public RascunhoReceita(Usuario autor, String titulo, String conteudo) {
        this.autor = autor;
        this.titulo = titulo;
        this.conteudo = conteudo;
    }

    @PrePersist
    void atualizarData() { atualizadoEm = Instant.now(); }

    public Integer getId() { return id; }
    public Usuario getAutor() { return autor; }
    public String getTitulo() { return titulo; }
    public String getConteudo() { return conteudo; }
    public Instant getAtualizadoEm() { return atualizadoEm; }
    public void atualizar(String titulo, String conteudo) { this.titulo = titulo; this.conteudo = conteudo; this.atualizadoEm = Instant.now(); }
}
