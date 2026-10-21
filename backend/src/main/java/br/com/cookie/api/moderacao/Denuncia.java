package br.com.cookie.api.moderacao;

import java.time.Instant;

import br.com.cookie.api.comentario.Comentario;
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
@Table(name = "denuncia")
public class Denuncia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_denuncia")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_denunciante", nullable = false)
    private Usuario denunciante;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario_denunciado", nullable = false)
    private Usuario denunciado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_comentario")
    private Comentario comentario;

    @Column(nullable = false, length = 500)
    private String motivo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusDenuncia status = StatusDenuncia.ABERTA;

    @Column(name = "data_denuncia", nullable = false, updatable = false)
    private Instant dataDenuncia;

    protected Denuncia() {
    }

    public Denuncia(Usuario denunciante, Usuario denunciado, Comentario comentario, String motivo) {
        this.denunciante = denunciante;
        this.denunciado = denunciado;
        this.comentario = comentario;
        this.motivo = motivo;
    }

    @PrePersist
    void aoCriar() {
        if (dataDenuncia == null) {
            dataDenuncia = Instant.now();
        }
    }

    public Integer getId() {
        return id;
    }

    public Usuario getDenunciante() {
        return denunciante;
    }

    public Usuario getDenunciado() {
        return denunciado;
    }

    public Comentario getComentario() {
        return comentario;
    }

    public String getMotivo() {
        return motivo;
    }

    public StatusDenuncia getStatus() {
        return status;
    }

    public void setStatus(StatusDenuncia status) {
        this.status = status;
    }

    public Instant getDataDenuncia() {
        return dataDenuncia;
    }
}
