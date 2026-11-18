package br.com.cookie.api.seguranca;

import java.time.Duration;
import java.time.Instant;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletResponse;

@Component
public class SessionCookieService {
    public static final String SESSION_HEADER = "X-Session-Id";
    private final boolean secure;
    private final String sameSite;

    public SessionCookieService(@Value("${app.auth.cookie-secure:false}") boolean secure,
            @Value("${app.auth.cookie-same-site:Lax}") String sameSite) {
        this.secure = secure;
        this.sameSite = sameSite;
    }

    public void set(HttpServletResponse response, Integer userId, String token, Instant expiresAt) {
        long seconds = Math.max(0, Duration.between(Instant.now(), expiresAt).toSeconds());
        response.addHeader("Set-Cookie", ResponseCookie.from(cookieName(userId), token)
                .httpOnly(true).secure(secure).path("/api").sameSite(sameSite)
                .maxAge(Duration.ofSeconds(seconds)).build().toString());
    }

    public void clear(HttpServletResponse response, Integer userId) {
        response.addHeader("Set-Cookie", ResponseCookie.from(cookieName(userId), "")
                .httpOnly(true).secure(secure).path("/api").sameSite(sameSite)
                .maxAge(Duration.ZERO).build().toString());
    }

    public static String cookieName(Integer userId) { return "mums_session_" + userId; }
}
