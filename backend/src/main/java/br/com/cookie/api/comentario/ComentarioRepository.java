package br.com.cookie.api.comentario;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComentarioRepository extends JpaRepository<Comentario, Integer> {

    @EntityGraph(attributePaths = "autor")
    Page<Comentario> findByReceitaIdAndStatusOrderByDataComentarioDesc(Integer idReceita, StatusComentario status,
            Pageable pageable);

    @EntityGraph(attributePaths = "autor")
    Page<Comentario> findByReceitaIdAndStatusAndFotoResultadoIsNotNullOrderByDataComentarioDesc(
            Integer idReceita, StatusComentario status, Pageable pageable);
}
