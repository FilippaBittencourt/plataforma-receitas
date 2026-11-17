package br.com.cookie.api.usuario;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SeguidorRepository extends JpaRepository<Seguidor, SeguidorId> {

    long countBySeguidoId(Integer idSeguido);

    long countBySeguidorId(Integer idSeguidor);

    boolean existsBySeguidorIdAndSeguidoId(Integer idSeguidor, Integer idSeguido);

    List<Seguidor> findBySeguidoIdOrderByDataSeguimentoDesc(Integer idSeguido);

    List<Seguidor> findBySeguidorIdOrderByDataSeguimentoDesc(Integer idSeguidor);
}
