package br.com.cookie.api.receita;

import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class FavoritoId implements Serializable {

    @Column(name = "id_usuario")
    private Integer idUsuario;

    @Column(name = "id_receita")
    private Integer idReceita;

    protected FavoritoId() {}

    public FavoritoId(Integer idUsuario, Integer idReceita) {
        this.idUsuario = idUsuario;
        this.idReceita = idReceita;
    }

    @Override
    public boolean equals(Object other) {
        return other instanceof FavoritoId id
                && Objects.equals(idUsuario, id.idUsuario)
                && Objects.equals(idReceita, id.idReceita);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idUsuario, idReceita);
    }
}
