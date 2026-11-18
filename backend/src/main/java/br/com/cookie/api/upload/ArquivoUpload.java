package br.com.cookie.api.upload;

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
import jakarta.persistence.Table;

@Entity
@Table(name = "arquivo_upload")
public class ArquivoUpload {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_arquivo")
    private Long id;

    @Column(name = "nome_arquivo", nullable = false, unique = true, length = 80)
    private String nomeArquivo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario")
    private Usuario usuario;

    @Column(name = "tamanho_bytes", nullable = false)
    private long tamanhoBytes;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant criadoEm;

    protected ArquivoUpload() {}

    public ArquivoUpload(String nomeArquivo, Usuario usuario, long tamanhoBytes) {
        this.nomeArquivo = nomeArquivo;
        this.usuario = usuario;
        this.tamanhoBytes = tamanhoBytes;
    }

    @PrePersist
    void aoCriar() { if (criadoEm == null) criadoEm = Instant.now(); }

    public Long getId() { return id; }
    public String getNomeArquivo() { return nomeArquivo; }
    public Usuario getUsuario() { return usuario; }
    public long getTamanhoBytes() { return tamanhoBytes; }
    public Instant getCriadoEm() { return criadoEm; }
}
