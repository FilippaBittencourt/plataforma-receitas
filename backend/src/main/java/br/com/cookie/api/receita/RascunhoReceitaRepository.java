package br.com.cookie.api.receita;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RascunhoReceitaRepository extends JpaRepository<RascunhoReceita, Integer> {
    List<RascunhoReceita> findByAutorIdOrderByAtualizadoEmDesc(Integer idAutor);
    Optional<RascunhoReceita> findByIdAndAutorId(Integer id, Integer idAutor);
}
