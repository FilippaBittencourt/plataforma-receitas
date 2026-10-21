package br.com.cookie.api.seguranca;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import br.com.cookie.api.usuario.Usuario;

@Service
public class TokenService {

    static final String CLAIM_PAPEIS = "papeis";

    private final JwtEncoder encoder;
    private final Duration validade;

    public TokenService(JwtEncoder encoder, @Value("${app.jwt.validade}") Duration validade) {
        this.encoder = encoder;
        this.validade = validade;
    }

    public TokenGerado gerar(Usuario usuario) {
        Instant agora = Instant.now();
        Instant expiraEm = agora.plus(validade);
        var claims = JwtClaimsSet.builder()
                .issuer("cookie-api")
                .issuedAt(agora)
                .expiresAt(expiraEm)
                .subject(usuario.getId().toString())
                .claim("nome_usuario", usuario.getNomeUsuario())
                .claim(CLAIM_PAPEIS, List.of(usuario.getTipo().name()))
                .build();
        var header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return new TokenGerado(token, expiraEm);
    }

    public record TokenGerado(String token, Instant expiraEm) {
    }
}
