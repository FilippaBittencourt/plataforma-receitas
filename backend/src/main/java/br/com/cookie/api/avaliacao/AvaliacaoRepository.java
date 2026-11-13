package br.com.cookie.api.avaliacao;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AvaliacaoRepository extends JpaRepository<Avaliacao, Long> {

    List<Avaliacao> findByUsuarioIdOrderByDataAvaliacaoDescIdDesc(Integer idUsuario);

    List<Avaliacao> findByReceitaIdOrderByDataAvaliacaoDescIdDesc(Integer idReceita);

    java.util.Optional<Avaliacao> findFirstByReceitaIdAndUsuarioIdOrderByDataAvaliacaoDescIdDesc(
            Integer idReceita, Integer idUsuario);

    long countByUsuarioId(Integer idUsuario);
}
