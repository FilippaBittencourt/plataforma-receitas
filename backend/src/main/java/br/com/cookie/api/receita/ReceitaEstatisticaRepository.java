package br.com.cookie.api.receita;

import org.springframework.data.repository.Repository;

import java.util.Optional;

/** Somente leitura: a view RECEITA_ESTATISTICA é calculada pelo banco. */
public interface ReceitaEstatisticaRepository extends Repository<ReceitaEstatistica, Integer> {

    Optional<ReceitaEstatistica> findById(Integer idReceita);
}
