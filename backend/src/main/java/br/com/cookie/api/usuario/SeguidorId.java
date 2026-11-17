package br.com.cookie.api.usuario;

import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class SeguidorId implements Serializable {

    @Column(name = "id_seguidor")
    private Integer idSeguidor;

    @Column(name = "id_seguido")
    private Integer idSeguido;

    protected SeguidorId() {}

    public SeguidorId(Integer idSeguidor, Integer idSeguido) {
        this.idSeguidor = idSeguidor;
        this.idSeguido = idSeguido;
    }

    @Override
    public boolean equals(Object other) {
        return other instanceof SeguidorId id
                && Objects.equals(idSeguidor, id.idSeguidor)
                && Objects.equals(idSeguido, id.idSeguido);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idSeguidor, idSeguido);
    }
}
