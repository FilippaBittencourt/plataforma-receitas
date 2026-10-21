package br.com.cookie.api.moderacao;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DenunciaRepository extends JpaRepository<Denuncia, Integer> {

    @EntityGraph(attributePaths = {"denunciante", "denunciado", "comentario"})
    List<Denuncia> findByStatusOrderByDataDenunciaDesc(StatusDenuncia status);

    long countByStatus(StatusDenuncia status);
}
