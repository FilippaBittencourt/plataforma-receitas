package br.com.cookie.api.comum;

import java.util.List;
import java.util.function.Function;

import org.springframework.data.domain.Page;

/** Página de resultados com formato estável para o front-end. */
public record Pagina<T>(List<T> itens, int pagina, int tamanho, long total, int totalPaginas) {

    public static <E, T> Pagina<T> de(Page<E> page, Function<E, T> conversor) {
        return new Pagina<>(page.getContent().stream().map(conversor).toList(), page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages());
    }
}
