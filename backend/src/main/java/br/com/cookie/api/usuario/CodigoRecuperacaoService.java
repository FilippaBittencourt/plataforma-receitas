package br.com.cookie.api.usuario;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.HexFormat;

import org.springframework.stereotype.Service;

@Service
public class CodigoRecuperacaoService {
    private static final char[] ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray();
    private static final SecureRandom RANDOM = new SecureRandom();

    public String gerar() {
        char[] codigo = new char[20];
        for (int i = 0; i < codigo.length; i++) codigo[i] = ALFABETO[RANDOM.nextInt(ALFABETO.length)];
        return new String(codigo).replaceAll("(.{4})(?=.)", "$1-");
    }

    public String hash(String codigo) {
        String normalizado = codigo == null ? "" : codigo.replaceAll("[^A-Za-z0-9]", "").toUpperCase(java.util.Locale.ROOT);
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(normalizado.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponível.", e);
        }
    }

    public boolean confere(String codigo, String hashArmazenado) {
        if (codigo == null || hashArmazenado == null) return false;
        byte[] informado = hash(codigo).getBytes(StandardCharsets.US_ASCII);
        byte[] armazenado = hashArmazenado.getBytes(StandardCharsets.US_ASCII);
        return MessageDigest.isEqual(informado, armazenado);
    }
}
