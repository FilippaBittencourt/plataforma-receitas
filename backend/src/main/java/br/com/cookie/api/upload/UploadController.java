package br.com.cookie.api.upload;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.time.Duration;
import java.time.Instant;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;

import br.com.cookie.api.comum.ApiException;
import br.com.cookie.api.usuario.UsuarioService;
import br.com.cookie.api.usuario.Usuario;
import br.com.cookie.api.receita.ReceitaRepository;
import br.com.cookie.api.comentario.ComentarioRepository;
import br.com.cookie.api.receita.RascunhoReceitaRepository;
import br.com.cookie.api.usuario.UsuarioRepository;

/**
 * Recebe fotos (receita, resultado, perfil) e devolve a URL para usar nos outros endpoints.
 * Os arquivos ficam em disco, na pasta app.uploads.pasta, e são servidos em /uploads/**.
 */
@RestController
public class UploadController {

    private static final long LIMITE_USUARIO_BYTES = 100L * 1024 * 1024;
    private static final int LIMITE_USUARIO_ARQUIVOS = 25;
    private static final Pattern NOME_VALIDO = Pattern.compile("[0-9a-f-]{36}\\.(jpg|png|webp)");

    private final Path pasta;
    private final UsuarioService usuarios;
    private final ArquivoUploadRepository arquivos;
    private final ReceitaRepository receitas;
    private final ComentarioRepository comentarios;
    private final RascunhoReceitaRepository rascunhos;
    private final UsuarioRepository usuarioRepository;
    private final long limiteTotalBytes;
    private final JdbcTemplate jdbc;

    public UploadController(@Value("${app.uploads.pasta}") String pasta, UsuarioService usuarios,
            ArquivoUploadRepository arquivos, ReceitaRepository receitas, ComentarioRepository comentarios,
            RascunhoReceitaRepository rascunhos, UsuarioRepository usuarioRepository,
            @Value("${app.uploads.limite-total-bytes:5368709120}") long limiteTotalBytes,
            JdbcTemplate jdbc) throws IOException {
        this.pasta = Path.of(pasta).toAbsolutePath().normalize();
        this.usuarios = usuarios;
        this.arquivos = arquivos;
        this.receitas = receitas;
        this.comentarios = comentarios;
        this.rascunhos = rascunhos;
        this.usuarioRepository = usuarioRepository;
        this.limiteTotalBytes = limiteTotalBytes;
        this.jdbc = jdbc;
        Files.createDirectories(this.pasta);
    }

    public record UploadResponse(String url) {
    }

    @PostMapping("/api/uploads")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    UploadResponse enviar(@AuthenticationPrincipal Jwt jwt, @RequestParam("arquivo") MultipartFile arquivo)
            throws IOException {
        Usuario usuario = usuarios.ativo(jwt);
        if (arquivo.isEmpty()) {
            throw ApiException.invalido("Escolha uma foto.");
        }
        // Serializa a checagem e reserva de cotas entre requisições e instâncias.
        jdbc.execute("select pg_advisory_xact_lock(741258963)");
        if (arquivos.countByUsuarioId(usuario.getId()) >= LIMITE_USUARIO_ARQUIVOS
                || arquivos.totalBytesUsuario(usuario.getId()) + arquivo.getSize() > LIMITE_USUARIO_BYTES
                || arquivos.totalBytes() + arquivo.getSize() > limiteTotalBytes) {
            throw new ApiException(HttpStatus.INSUFFICIENT_STORAGE,
                    "O limite de armazenamento para fotos foi atingido. Remova fotos sem uso e tente novamente.");
        }
        // A extensão vem do conteúdo real do arquivo, não do nome nem do Content-Type enviados.
        String extensao = extensaoDaImagem(arquivo);
        String nome = UUID.randomUUID() + extensao;
        try (InputStream in = arquivo.getInputStream()) {
            Files.copy(in, pasta.resolve(nome), StandardCopyOption.REPLACE_EXISTING);
        }
        try {
            arquivos.save(new ArquivoUpload(nome, usuario, arquivo.getSize()));
        } catch (RuntimeException e) {
            Files.deleteIfExists(pasta.resolve(nome));
            throw e;
        }
        return new UploadResponse("/uploads/" + nome);
    }

    @DeleteMapping("/api/uploads/{nome}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    void remover(@AuthenticationPrincipal Jwt jwt, @PathVariable String nome) throws IOException {
        Usuario usuario = usuarios.ativo(jwt);
        if (!NOME_VALIDO.matcher(nome).matches()) throw ApiException.naoEncontrado("Foto não encontrada.");
        ArquivoUpload arquivo = arquivos.findByNomeArquivoAndUsuarioId(nome, usuario.getId())
                .orElseThrow(() -> ApiException.naoEncontrado("Foto não encontrada."));
        if (referenciado(nome)) return;
        Files.deleteIfExists(pasta.resolve(nome));
        arquivos.delete(arquivo);
    }

    @Scheduled(cron = "0 17 3 * * *", zone = "America/Sao_Paulo")
    @Transactional
    void limparOrfaos() {
        Instant limite = Instant.now().minus(Duration.ofHours(24));
        long ultimoId = 0;
        List<ArquivoUpload> lote;
        do {
            lote = arquivos.findTop500ByIdGreaterThanAndCriadoEmBeforeOrderByIdAsc(ultimoId, limite);
            for (ArquivoUpload arquivo : lote) {
                ultimoId = arquivo.getId();
            try {
                if (!referenciado(arquivo.getNomeArquivo())) {
                    Files.deleteIfExists(pasta.resolve(arquivo.getNomeArquivo()));
                    arquivos.delete(arquivo);
                }
            } catch (IOException e) {
                // Mantém o registro para uma nova tentativa no próximo ciclo.
            }
            }
        } while (lote.size() == 500);
        try (var existentes = Files.list(pasta)) {
            existentes.filter(Files::isRegularFile).filter(path -> {
                try { return Files.getLastModifiedTime(path).toInstant().isBefore(limite); }
                catch (IOException e) { return false; }
            }).forEach(path -> {
                String nome = path.getFileName().toString();
                if (!arquivos.existsByNomeArquivo(nome) && !referenciado(nome)) {
                    try { Files.deleteIfExists(path); } catch (IOException ignored) { }
                }
            });
        } catch (IOException ignored) { }
    }

    private boolean referenciado(String nome) {
        String url = "/uploads/" + nome;
        return usuarioRepository.existsByFotoPerfil(url) || receitas.existsByFotoPrincipal(url)
                || comentarios.existsByFotoResultado(url) || rascunhos.existsByConteudoContaining(nome);
    }

    private static String extensaoDaImagem(MultipartFile arquivo) throws IOException {
        byte[] cabecalho;
        try (InputStream in = arquivo.getInputStream()) {
            cabecalho = in.readNBytes(12);
        }
        String extensao;
        if (comeca(cabecalho, 0xFF, 0xD8, 0xFF)) extensao = ".jpg";
        else if (comeca(cabecalho, 0x89, 'P', 'N', 'G')) extensao = ".png";
        else extensao = null;
        if (extensao != null) {
            if (!imagemDecodificavel(arquivo)) {
                throw ApiException.invalido("A imagem está inválida ou excede as dimensões permitidas.");
            }
            return extensao;
        }
        if (cabecalho.length >= 12 && comeca(cabecalho, 'R', 'I', 'F', 'F')
                && Arrays.equals(Arrays.copyOfRange(cabecalho, 8, 12), "WEBP".getBytes())
                && imagemDecodificavel(arquivo)) {
            return ".webp";
        }
        throw ApiException.invalido("Envie uma imagem PNG, JPG ou WEBP.");
    }

    private static boolean imagemDecodificavel(MultipartFile arquivo) {
        try (InputStream input = arquivo.getInputStream(); ImageInputStream imagem = ImageIO.createImageInputStream(input)) {
            if (imagem == null || !ImageIO.getImageReaders(imagem).hasNext()) return false;
            ImageReader reader = ImageIO.getImageReaders(imagem).next();
            try {
                reader.setInput(imagem, true, true);
                int largura = reader.getWidth(0);
                int altura = reader.getHeight(0);
                return largura > 0 && altura > 0 && (long) largura * altura <= 16_000_000L
                        && reader.read(0) != null;
            } finally {
                reader.dispose();
            }
        } catch (IOException e) {
            return false;
        }
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
