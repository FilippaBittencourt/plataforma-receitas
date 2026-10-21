package br.com.cookie.api.usuario;

import java.text.Normalizer;
import java.util.Locale;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.cookie.api.avaliacao.AvaliacaoRepository;
import br.com.cookie.api.comum.ApiException;
import br.com.cookie.api.receita.ReceitaRepository;
import br.com.cookie.api.receita.StatusReceita;
import br.com.cookie.api.seguranca.TokenService;
import br.com.cookie.api.usuario.UsuarioDtos.AlterarEmailRequest;
import br.com.cookie.api.usuario.UsuarioDtos.AlterarSenhaRequest;
import br.com.cookie.api.usuario.UsuarioDtos.AtualizarPerfilRequest;
import br.com.cookie.api.usuario.UsuarioDtos.CadastroRequest;
import br.com.cookie.api.usuario.UsuarioDtos.Estatisticas;
import br.com.cookie.api.usuario.UsuarioDtos.LoginRequest;
import br.com.cookie.api.usuario.UsuarioDtos.Notificacoes;
import br.com.cookie.api.usuario.UsuarioDtos.PerfilPublicoResponse;
import br.com.cookie.api.usuario.UsuarioDtos.PerfilResponse;
import br.com.cookie.api.usuario.UsuarioDtos.TokenResponse;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarios;
    private final ReceitaRepository receitas;
    private final AvaliacaoRepository avaliacoes;
    private final PasswordEncoder senhas;
    private final TokenService tokens;

    public UsuarioService(UsuarioRepository usuarios, ReceitaRepository receitas, AvaliacaoRepository avaliacoes,
            PasswordEncoder senhas, TokenService tokens) {
        this.usuarios = usuarios;
        this.receitas = receitas;
        this.avaliacoes = avaliacoes;
        this.senhas = senhas;
        this.tokens = tokens;
    }

    /** Dono do token. Se a conta foi excluída depois do login, o token deixa de valer. */
    @Transactional(readOnly = true)
    public Usuario logado(Jwt jwt) {
        return usuarios.findById(Integer.valueOf(jwt.getSubject()))
                .orElseThrow(() -> ApiException.naoAutorizado("Sessão inválida. Entre novamente."));
    }

    /** Dono do token, exigindo conta ativa: contas suspensas só podem ler. */
    @Transactional(readOnly = true)
    public Usuario ativo(Jwt jwt) {
        Usuario usuario = logado(jwt);
        if (usuario.isSuspenso()) {
            throw ApiException.proibido("Sua conta está suspensa pela moderação.");
        }
        return usuario;
    }

    @Transactional
    public TokenResponse cadastrar(CadastroRequest req) {
        String email = normalizarEmail(req.email());
        if (usuarios.existsByEmail(email)) {
            throw ApiException.conflito("Já existe uma conta com este e-mail.");
        }
        String nomeUsuario;
        if (req.nomeUsuario() != null && !req.nomeUsuario().isBlank()) {
            nomeUsuario = normalizarNomeUsuario(req.nomeUsuario());
            if (usuarios.existsByNomeUsuario(nomeUsuario)) {
                throw ApiException.conflito("Este nome de usuário já está em uso.");
            }
        } else {
            nomeUsuario = gerarNomeUsuario(req.nome());
        }
        var usuario = usuarios.save(new Usuario(req.nome().trim(), nomeUsuario, email, senhas.encode(req.senha())));
        return emitirToken(usuario);
    }

    @Transactional(readOnly = true)
    public TokenResponse entrar(LoginRequest req) {
        var usuario = usuarios.findByEmail(normalizarEmail(req.email()))
                .filter(u -> senhas.matches(req.senha(), u.getSenhaHash()))
                .orElseThrow(() -> ApiException.naoAutorizado("E-mail ou senha incorretos."));
        if (usuario.isSuspenso()) {
            throw ApiException.proibido("Sua conta está suspensa pela moderação.");
        }
        return emitirToken(usuario);
    }

    @Transactional(readOnly = true)
    public PerfilResponse perfil(Jwt jwt) {
        return perfil(logado(jwt));
    }

    @Transactional
    public PerfilResponse atualizarPerfil(Jwt jwt, AtualizarPerfilRequest req) {
        Usuario usuario = ativo(jwt);
        String nomeUsuario = normalizarNomeUsuario(req.nomeUsuario());
        if (!nomeUsuario.equals(usuario.getNomeUsuario()) && usuarios.existsByNomeUsuario(nomeUsuario)) {
            throw ApiException.conflito("Este nome de usuário já está em uso.");
        }
        usuario.setNome(req.nome().trim());
        usuario.setNomeUsuario(nomeUsuario);
        usuario.setBio(vazioParaNulo(req.bio()));
        usuario.setFotoPerfil(vazioParaNulo(req.fotoPerfil()));
        return perfil(usuarios.save(usuario));
    }

    @Transactional
    public PerfilResponse alterarEmail(Jwt jwt, AlterarEmailRequest req) {
        Usuario usuario = ativo(jwt);
        String email = normalizarEmail(req.email());
        if (!email.equals(usuario.getEmail()) && usuarios.existsByEmail(email)) {
            throw ApiException.conflito("Já existe outra conta com este e-mail.");
        }
        usuario.setEmail(email);
        return perfil(usuarios.save(usuario));
    }

    @Transactional
    public void alterarSenha(Jwt jwt, AlterarSenhaRequest req) {
        Usuario usuario = logado(jwt);
        if (!senhas.matches(req.senhaAtual(), usuario.getSenhaHash())) {
            throw ApiException.invalido("A senha atual está incorreta.");
        }
        if (req.senhaAtual().equals(req.novaSenha())) {
            throw ApiException.invalido("A nova senha precisa ser diferente da atual.");
        }
        usuario.setSenhaHash(senhas.encode(req.novaSenha()));
        usuarios.save(usuario);
    }

    @Transactional
    public PerfilResponse atualizarNotificacoes(Jwt jwt, Notificacoes req) {
        Usuario usuario = logado(jwt);
        usuario.setNotifAvaliacoes(req.avaliacoes());
        usuario.setNotifComentarios(req.comentarios());
        usuario.setNotifNovidades(req.novidades());
        return perfil(usuarios.save(usuario));
    }

    /**
     * Exclui a conta. O banco cuida do resto: avaliações, comentários e denúncias da pessoa são apagados
     * (CASCADE) e as receitas publicadas ficam no site sem autor (SET NULL).
     */
    @Transactional
    public void excluir(Jwt jwt) {
        usuarios.deleteById(logado(jwt).getId());
    }

    @Transactional(readOnly = true)
    public PerfilPublicoResponse perfilPublico(String nomeUsuario) {
        Usuario u = usuarios.findByNomeUsuario(normalizarNomeUsuario(nomeUsuario))
                .orElseThrow(() -> ApiException.naoEncontrado("Usuário não encontrado."));
        return new PerfilPublicoResponse(u.getId(), u.getNome(), u.getNomeUsuario(), u.getBio(), u.getFotoPerfil(),
                u.isAdministrador(), u.getDataCadastro(), estatisticas(u));
    }

    public PerfilResponse perfil(Usuario u) {
        return new PerfilResponse(u.getId(), u.getNome(), u.getNomeUsuario(), u.getEmail(), u.getBio(),
                u.getFotoPerfil(), u.getTipo(), u.getStatus(), u.getDataCadastro(), Notificacoes.de(u),
                estatisticas(u));
    }

    private Estatisticas estatisticas(Usuario u) {
        return new Estatisticas(receitas.countByAutorIdAndStatus(u.getId(), StatusReceita.APROVADA),
                avaliacoes.countByUsuarioId(u.getId()));
    }

    private TokenResponse emitirToken(Usuario usuario) {
        var token = tokens.gerar(usuario);
        return new TokenResponse(token.token(), token.expiraEm(), perfil(usuario));
    }

    static String normalizarEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    public static String normalizarNomeUsuario(String nomeUsuario) {
        return nomeUsuario.trim().replaceFirst("^@+", "").toLowerCase(Locale.ROOT);
    }

    /** "Júlia Ferraz" vira "juliaferraz"; se já existir, "juliaferraz2", "juliaferraz3"... */
    private String gerarNomeUsuario(String nome) {
        String base = Normalizer.normalize(nome, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]", "");
        if (base.length() < 3) {
            base = "cozinheiro" + base;
        }
        base = base.substring(0, Math.min(base.length(), 26));
        String candidato = base;
        for (int i = 2; usuarios.existsByNomeUsuario(candidato); i++) {
            candidato = base + i;
        }
        return candidato;
    }

    private static String vazioParaNulo(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}
