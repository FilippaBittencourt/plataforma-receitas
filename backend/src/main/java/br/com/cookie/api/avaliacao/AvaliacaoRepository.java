package br.com.cookie.api.avaliacao;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AvaliacaoRepository extends JpaRepository<Avaliacao, Long> {

    List<Avaliacao> findByUsuarioIdOrderByDataAvaliacaoDescIdDesc(Integer idUsuario);

    List<Avaliacao> findByReceitaIdOrderByDataAvaliacaoDescIdDesc(Integer idReceita);

    java.util.Optional<Avaliacao> findFirstByReceitaIdAndUsuarioIdOrderByDataAvaliacaoDescIdDesc(
            Integer idReceita, Integer idUsuario);

    long countByUsuarioId(Integer idUsuario);

    @Query("select count(distinct a.receita.id) from Avaliacao a where a.usuario.id = :idUsuario")
    long countReceitasDistintasByUsuarioId(@Param("idUsuario") Integer idUsuario);
}
