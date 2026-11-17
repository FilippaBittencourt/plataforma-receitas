package br.com.cookie.api.receita;

import java.time.Instant;

import br.com.cookie.api.usuario.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "favorito")
public class Favorito {

    @EmbeddedId
    private FavoritoId id;

    @MapsId("idUsuario")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario")
    private Usuario usuario;

    @MapsId("idReceita")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_receita")
    private Receita receita;

    @Column(name = "data_favorito", nullable = false, updatable = false)
    private Instant dataFavorito;

    protected Favorito() {}

    public Favorito(Usuario usuario, Receita receita) {
        this.id = new FavoritoId(usuario.getId(), receita.getId());
        this.usuario = usuario;
        this.receita = receita;
    }

    @PrePersist
    void aoCriar() {
        if (dataFavorito == null) dataFavorito = Instant.now();
    }

    public Receita getReceita() {
        return receita;
    }
}
