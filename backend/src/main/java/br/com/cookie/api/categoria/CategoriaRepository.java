package br.com.cookie.api.categoria;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CategoriaRepository extends JpaRepository<Categoria, Integer> {

    Optional<Categoria> findBySlug(String slug);

    /** Categorias com o total de receitas aprovadas, em ordem de cadastro. */
    @Query("""
            select new br.com.cookie.api.categoria.CategoriaResponse(c.id, c.nome, c.slug, count(r))
            from Categoria c
            left join Receita r on r.categoria = c and r.status = br.com.cookie.api.receita.StatusReceita.APROVADA
            group by c.id, c.nome, c.slug
            order by c.id
            """)
    List<CategoriaResponse> listarComTotais();
}
