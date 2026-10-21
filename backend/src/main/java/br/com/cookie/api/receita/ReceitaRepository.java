package br.com.cookie.api.receita;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ReceitaRepository extends JpaRepository<Receita, Integer>, JpaSpecificationExecutor<Receita> {

    List<Receita> findByAutorIdOrderByDataPublicacaoDesc(Integer idAutor);

    List<Receita> findByAutorIdAndStatusOrderByDataPublicacaoDesc(Integer idAutor, StatusReceita status);

    long countByAutorIdAndStatus(Integer idAutor, StatusReceita status);

    List<Receita> findByStatusOrderByDataPublicacaoAsc(StatusReceita status);

    long countByStatus(StatusReceita status);

    long countByStatusAndDataModeracaoGreaterThanEqual(StatusReceita status, Instant desde);
}
