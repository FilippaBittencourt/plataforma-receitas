package br.com.cookie.api.seguranca;

import java.io.IOException;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class LimiteAutenticacaoFilter extends OncePerRequestFilter {
    private final LimiteAutenticacaoService limites;
    private final int cadastro;
    private final int login;
    private final int redefinicao;

    public LimiteAutenticacaoFilter(LimiteAutenticacaoService limites,
            @Value("${app.auth.limite.cadastro:10}") int cadastro,
            @Value("${app.auth.limite.login:30}") int login,
            @Value("${app.auth.limite.redefinicao:15}") int redefinicao) {
        this.limites = limites;
        this.cadastro = cadastro;
        this.login = login;
        this.redefinicao = redefinicao;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String rota = request.getRequestURI();
        int limite = switch (rota) {
            case "/api/auth/cadastro" -> cadastro;
            case "/api/auth/login" -> login;
            case "/api/auth/redefinir-senha" -> redefinicao;
            default -> 0;
        };
        if (limite == 0 || !"POST".equals(request.getMethod())) {
            chain.doFilter(request, response);
            return;
        }
        String cliente = request.getHeader("X-Forwarded-For");
        if (cliente == null || cliente.isBlank()) cliente = request.getRemoteAddr();
        else cliente = cliente.split(",", 2)[0].trim();
        if (!limites.registrar(rota, cliente, limite)) {
            response.setStatus(429);
            response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
            response.getWriter().write("{\"status\":429,\"detail\":\"Muitas tentativas. Aguarde alguns minutos e tente novamente.\"}");
            return;
        }
        chain.doFilter(request, response);
    }
}
