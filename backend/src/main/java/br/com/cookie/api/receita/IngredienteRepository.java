package br.com.cookie.api.receita;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface IngredienteRepository extends JpaRepository<Ingrediente, Integer> {

    Optional<Ingrediente> findByNome(String nome);
}
