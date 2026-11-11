package br.com.cookie.api.usuario;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "usuario")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario")
    private Integer id;

    @Column(nullable = false, length = 150)
    private String nome;

    @Column(name = "nome_usuario", nullable = false, unique = true, length = 30)
    private String nomeUsuario;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "senha_hash", nullable = false)
    private String senhaHash;

    @Column(name = "codigo_recuperacao_hash", length = 64)
    private String codigoRecuperacaoHash;

    @Column(name = "foto_perfil", length = 500)
    private String fotoPerfil;

    @Column(length = 160)
    private String bio;

    @Column(name = "data_cadastro", nullable = false, updatable = false)
    private Instant dataCadastro;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_usuario", nullable = false, length = 20)
    private TipoUsuario tipo = TipoUsuario.USUARIO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusUsuario status = StatusUsuario.ATIVO;

    @Column(name = "notif_avaliacoes", nullable = false)
    private boolean notifAvaliacoes = true;

    @Column(name = "notif_comentarios", nullable = false)
    private boolean notifComentarios = true;

    @Column(name = "notif_novidades", nullable = false)
    private boolean notifNovidades = false;

    protected Usuario() {
    }

    public Usuario(String nome, String nomeUsuario, String email, String senhaHash) {
        this.nome = nome;
        this.nomeUsuario = nomeUsuario;
        this.email = email;
        this.senhaHash = senhaHash;
    }

    @PrePersist
    void aoCriar() {
        if (dataCadastro == null) {
            dataCadastro = Instant.now();
        }
    }

    public boolean isAdministrador() {
        return tipo == TipoUsuario.ADMINISTRADOR;
    }

    public boolean isSuspenso() {
        return status == StatusUsuario.SUSPENSO;
    }

    public Integer getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getNomeUsuario() {
        return nomeUsuario;
    }

    public void setNomeUsuario(String nomeUsuario) {
        this.nomeUsuario = nomeUsuario;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSenhaHash() {
        return senhaHash;
    }

    public void setSenhaHash(String senhaHash) {
        this.senhaHash = senhaHash;
    }

    public String getCodigoRecuperacaoHash() { return codigoRecuperacaoHash; }
    public void setCodigoRecuperacaoHash(String codigoRecuperacaoHash) { this.codigoRecuperacaoHash = codigoRecuperacaoHash; }

    public String getFotoPerfil() {
        return fotoPerfil;
    }

    public void setFotoPerfil(String fotoPerfil) {
        this.fotoPerfil = fotoPerfil;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public Instant getDataCadastro() {
        return dataCadastro;
    }

    public TipoUsuario getTipo() {
        return tipo;
    }

    public void setTipo(TipoUsuario tipo) {
        this.tipo = tipo;
    }

    public StatusUsuario getStatus() {
        return status;
    }

    public void setStatus(StatusUsuario status) {
        this.status = status;
    }

    public boolean isNotifAvaliacoes() {
        return notifAvaliacoes;
    }

    public void setNotifAvaliacoes(boolean notifAvaliacoes) {
        this.notifAvaliacoes = notifAvaliacoes;
    }

    public boolean isNotifComentarios() {
        return notifComentarios;
    }

    public void setNotifComentarios(boolean notifComentarios) {
        this.notifComentarios = notifComentarios;
    }

    public boolean isNotifNovidades() {
        return notifNovidades;
    }

    public void setNotifNovidades(boolean notifNovidades) {
        this.notifNovidades = notifNovidades;
    }
}
