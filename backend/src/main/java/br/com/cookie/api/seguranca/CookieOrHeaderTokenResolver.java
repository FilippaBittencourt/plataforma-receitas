package br.com.cookie.api.seguranca;

import java.util.Arrays;

import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;

@Component
public class CookieOrHeaderTokenResolver implements BearerTokenResolver {
    private final DefaultBearerTokenResolver bearer = new DefaultBearerTokenResolver();

    @Override
    public String resolve(HttpServletRequest request) {
        String fromHeader = bearer.resolve(request);
        if (fromHeader != null) return fromHeader;
        String id = request.getHeader(SessionCookieService.SESSION_HEADER);
        if (id == null || !id.matches("[0-9]{1,10}")) return null;
        String name = SessionCookieService.cookieName(Integer.valueOf(id));
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies()).filter(cookie -> name.equals(cookie.getName()))
                .map(jakarta.servlet.http.Cookie::getValue).findFirst().orElse(null);
    }
}
