package br.com.cookie.api.seguranca;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class LimiteAutenticacaoService {
    private final JdbcTemplate jdbc;

    public LimiteAutenticacaoService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public boolean registrar(String rota, String cliente, int limite) {
        Instant janela = Instant.ofEpochSecond(Instant.now().getEpochSecond() / 300 * 300);
        Integer total = jdbc.queryForObject("""
                insert into limite_autenticacao (rota, cliente, inicio_janela, quantidade) values (?, ?, ?, 1)
                on conflict (rota, cliente, inicio_janela)
                do update set quantidade = limite_autenticacao.quantidade + 1
                returning quantidade
                """, Integer.class, rota, cliente, java.sql.Timestamp.from(janela));
        return total != null && total <= limite;
    }

    @Scheduled(cron = "0 29 * * * *", zone = "UTC")
    public void limparJanelasAntigas() {
        jdbc.update("delete from limite_autenticacao where inicio_janela < ?",
                java.sql.Timestamp.from(Instant.now().minus(10, ChronoUnit.MINUTES)));
    }
}
