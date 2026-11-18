package br.com.cookie.api.assistente;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.cookie.api.comum.ApiException;

@Service
public class AssistenteLimiteService {
    private static final int MAXIMO_POR_JANELA = 12;
    private final JdbcTemplate jdbc;

    public AssistenteLimiteService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional
    public void registrarPergunta(String usuarioId) {
        int id = Integer.parseInt(usuarioId);
        Instant inicio = Instant.ofEpochSecond(Instant.now().getEpochSecond() / 60 * 60);
        Integer quantidade = jdbc.queryForObject("""
                insert into uso_assistente (id_usuario, inicio_janela, quantidade)
                values (?, ?, 1)
                on conflict (id_usuario, inicio_janela)
                do update set quantidade = uso_assistente.quantidade + 1
                returning quantidade
                """, Integer.class, id, Timestamp.from(inicio));
        Integer totalJanela = jdbc.queryForObject("""
                insert into uso_assistente_global (inicio_janela, quantidade) values (?, 1)
                on conflict (inicio_janela) do update set quantidade = uso_assistente_global.quantidade + 1
                returning quantidade
                """, Integer.class, Timestamp.from(inicio));
        if (totalJanela != null && totalJanela > 300) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                    "O assistente atingiu o limite temporário de uso. Tente novamente em um minuto.");
        }
        if (quantidade != null && quantidade > MAXIMO_POR_JANELA) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                    "Você enviou várias perguntas em pouco tempo. Aguarde um minuto e tente novamente.");
        }
    }

    @Scheduled(cron = "0 23 * * * *", zone = "UTC")
    @Transactional
    public void limparJanelasAntigas() {
        jdbc.update("delete from uso_assistente where inicio_janela < ?",
                Timestamp.from(Instant.now().minus(2, ChronoUnit.MINUTES)));
        jdbc.update("delete from uso_assistente_global where inicio_janela < ?",
                Timestamp.from(Instant.now().minus(2, ChronoUnit.MINUTES)));
    }
}
