package br.com.cookie.api.usuario;

import java.time.Instant;

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
@Table(name = "seguidor")
public class Seguidor {

    @EmbeddedId
    private SeguidorId id;

    @MapsId("idSeguidor")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_seguidor")
    private Usuario seguidor;

    @MapsId("idSeguido")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_seguido")
    private Usuario seguido;

    @Column(name = "data_seguimento", nullable = false, updatable = false)
    private Instant dataSeguimento;

    protected Seguidor() {}

    public Seguidor(Usuario seguidor, Usuario seguido) {
        this.id = new SeguidorId(seguidor.getId(), seguido.getId());
        this.seguidor = seguidor;
        this.seguido = seguido;
    }

    public Usuario getSeguidor() {
        return seguidor;
    }

    public Usuario getSeguido() {
        return seguido;
    }

    @PrePersist
    void aoCriar() {
        if (dataSeguimento == null) dataSeguimento = Instant.now();
    }
}
