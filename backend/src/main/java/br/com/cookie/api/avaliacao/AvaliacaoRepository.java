package br.com.cookie.api.avaliacao;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AvaliacaoRepository extends JpaRepository<Avaliacao, AvaliacaoId> {

    List<Avaliacao> findByUsuarioIdOrderByDataAvaliacaoDesc(Integer idUsuario);

    long countByUsuarioId(Integer idUsuario);
}
