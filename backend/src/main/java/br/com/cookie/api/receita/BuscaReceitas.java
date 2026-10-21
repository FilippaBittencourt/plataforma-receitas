package br.com.cookie.api.receita;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.hibernate.query.criteria.HibernateCriteriaBuilder;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Order;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

/** Filtros e ordenação da busca pública de receitas (só receitas aprovadas). */
public record BuscaReceitas(String texto, String categoria, String ingrediente, Origem origem, boolean verificadas,
        int minimoAvaliacoes, Ordem ordem) {

    public enum Ordem {
        RECENTES,
        MELHORES,
        MAIS_TESTADAS,
        /** Usada no ranking: verificadas primeiro, depois a média e o volume de avaliações. */
        RANKING;

        public static Ordem de(String valor) {
            if (valor == null || valor.isBlank()) {
                return RECENTES;
            }
            try {
                return valueOf(valor.trim().toUpperCase(Locale.ROOT).replace('-', '_'));
            } catch (IllegalArgumentException e) {
                return RECENTES;
            }
        }
    }

    public Specification<Receita> especificacao() {
        return (root, query, cb) -> {
            var hcb = (HibernateCriteriaBuilder) cb;
            List<Predicate> filtros = new ArrayList<>();
            filtros.add(cb.equal(root.get("status"), StatusReceita.APROVADA));

            if (temValor(texto)) {
                filtros.add(hcb.ilike(root.get("titulo"), contem(texto), '\\'));
            }
            if (temValor(categoria)) {
                filtros.add(cb.equal(root.get("categoria").get("slug"), categoria.trim()));
            }
            if (origem != null) {
                filtros.add(cb.equal(root.get("origem"), origem));
            }
            if (temValor(ingrediente) && query != null) {
                // EXISTS em vez de JOIN, para não repetir a receita quando o ingrediente aparece duas vezes.
                var sub = query.subquery(Integer.class);
                Root<Receita> r2 = sub.from(Receita.class);
                Join<Receita, ItemIngrediente> item = r2.join("ingredientes");
                sub.select(r2.get("id")).where(cb.equal(r2, root),
                        hcb.ilike(item.get("ingrediente").get("nome"), contem(ingrediente), '\\'));
                filtros.add(cb.exists(sub));
            }

            Join<Receita, ReceitaEstatistica> est = root.join("estatistica", JoinType.LEFT);
            if (verificadas) {
                filtros.add(cb.isTrue(est.get("verificada")));
            }
            if (minimoAvaliacoes > 0) {
                filtros.add(cb.ge(est.get("totalAvaliacoes"), minimoAvaliacoes));
            }

            // A consulta de contagem da paginação não precisa (nem aceita bem) ORDER BY.
            if (query != null && !Long.class.equals(query.getResultType())
                    && !long.class.equals(query.getResultType())) {
                query.orderBy(ordenacao(root, est, cb));
            }
            return cb.and(filtros.toArray(Predicate[]::new));
        };
    }

    private List<Order> ordenacao(Root<Receita> root, Join<Receita, ReceitaEstatistica> est, CriteriaBuilder cb) {
        var media = cb.coalesce(est.get("mediaGeral"), 0);
        var total = est.get("totalAvaliacoes");
        var maisNovas = cb.desc(root.get("dataPublicacao"));
        return switch (ordem) {
            case RECENTES -> List.of(maisNovas, cb.desc(root.get("id")));
            case MELHORES -> List.of(cb.desc(media), cb.desc(total), maisNovas);
            case MAIS_TESTADAS -> List.of(cb.desc(total), cb.desc(media), maisNovas);
            case RANKING -> List.of(cb.desc(est.get("verificada")), cb.desc(media), cb.desc(total), maisNovas);
        };
    }

    private static boolean temValor(String valor) {
        return valor != null && !valor.isBlank();
    }

    /** "%trecho%", escapando % e _ digitados pela pessoa. */
    private static String contem(String valor) {
        String escapado = valor.trim().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        return "%" + escapado + "%";
    }
}
