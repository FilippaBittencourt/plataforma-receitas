package br.com.cookie.api.upload;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import br.com.cookie.api.comum.ApiException;
import br.com.cookie.api.usuario.UsuarioService;

/**
 * Recebe fotos (receita, resultado, perfil) e devolve a URL para usar nos outros endpoints.
 * Os arquivos ficam em disco, na pasta app.uploads.pasta, e são servidos em /uploads/**.
 */
@RestController
public class UploadController {

    private final Path pasta;
    private final UsuarioService usuarios;

    public UploadController(@Value("${app.uploads.pasta}") String pasta, UsuarioService usuarios) throws IOException {
        this.pasta = Path.of(pasta).toAbsolutePath().normalize();
        this.usuarios = usuarios;
        Files.createDirectories(this.pasta);
    }

    public record UploadResponse(String url) {
    }

    @PostMapping("/api/uploads")
    @ResponseStatus(HttpStatus.CREATED)
    UploadResponse enviar(@AuthenticationPrincipal Jwt jwt, @RequestParam("arquivo") MultipartFile arquivo)
            throws IOException {
        usuarios.ativo(jwt);
        if (arquivo.isEmpty()) {
            throw ApiException.invalido("Escolha uma foto.");
        }
        // A extensão vem do conteúdo real do arquivo, não do nome nem do Content-Type enviados.
        String extensao = extensaoDaImagem(arquivo);
        String nome = UUID.randomUUID() + extensao;
        try (InputStream in = arquivo.getInputStream()) {
            Files.copy(in, pasta.resolve(nome), StandardCopyOption.REPLACE_EXISTING);
        }
        return new UploadResponse("/uploads/" + nome);
    }

    private static String extensaoDaImagem(MultipartFile arquivo) throws IOException {
        byte[] cabecalho;
        try (InputStream in = arquivo.getInputStream()) {
            cabecalho = in.readNBytes(12);
        }
        if (comeca(cabecalho, 0xFF, 0xD8, 0xFF)) {
            return ".jpg";
        }
        if (comeca(cabecalho, 0x89, 'P', 'N', 'G')) {
            return ".png";
        }
        if (cabecalho.length >= 12 && comeca(cabecalho, 'R', 'I', 'F', 'F')
                && Arrays.equals(Arrays.copyOfRange(cabecalho, 8, 12), "WEBP".getBytes())) {
            return ".webp";
        }
        throw ApiException.invalido("Envie uma imagem PNG, JPG ou WEBP.");
    }

    private static boolean comeca(byte[] dados, int... assinatura) {
        if (dados.length < assinatura.length) {
            return false;
        }
        for (int i = 0; i < assinatura.length; i++) {
            if ((dados[i] & 0xFF) != assinatura[i]) {
                return false;
            }
        }
        return true;
    }
}
