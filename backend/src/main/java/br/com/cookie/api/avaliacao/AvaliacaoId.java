package br.com.cookie.api.avaliacao;

import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/** Chave composta (id_receita, id_usuario): garante uma avaliação por pessoa em cada receita. */
@Embeddable
public class AvaliacaoId implements Serializable {

    @Column(name = "id_receita")
    private Integer idReceita;

    @Column(name = "id_usuario")
    private Integer idUsuario;

    protected AvaliacaoId() {
    }

    public AvaliacaoId(Integer idReceita, Integer idUsuario) {
        this.idReceita = idReceita;
        this.idUsuario = idUsuario;
    }

    public Integer getIdReceita() {
        return idReceita;
    }

    public Integer getIdUsuario() {
        return idUsuario;
    }

    @Override
    public boolean equals(Object o) {
        return o instanceof AvaliacaoId outro && Objects.equals(idReceita, outro.idReceita)
                && Objects.equals(idUsuario, outro.idUsuario);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idReceita, idUsuario);
    }
}
