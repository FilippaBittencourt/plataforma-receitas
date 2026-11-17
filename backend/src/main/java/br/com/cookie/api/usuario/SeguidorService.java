package br.com.cookie.api.usuario;

import java.util.List;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.cookie.api.comum.ApiException;
import br.com.cookie.api.usuario.UsuarioDtos.PerfilSeguidor;

@Service
public class SeguidorService {

    private final SeguidorRepository seguidores;
    private final UsuarioRepository usuarios;
    private final UsuarioService usuarioService;

    public SeguidorService(SeguidorRepository seguidores, UsuarioRepository usuarios, UsuarioService usuarioService) {
        this.seguidores = seguidores;
        this.usuarios = usuarios;
        this.usuarioService = usuarioService;
    }

    @Transactional
    public void seguir(Jwt jwt, String nomeUsuario) {
        Usuario pessoa = pessoaComum(jwt);
        Usuario alvo = encontrarMembro(nomeUsuario);
        if (pessoa.getId().equals(alvo.getId())) {
            throw ApiException.invalido("Você não pode seguir a si mesma.");
        }
        if (!seguidores.existsBySeguidorIdAndSeguidoId(pessoa.getId(), alvo.getId())) {
            seguidores.save(new Seguidor(pessoa, alvo));
        }
    }

    @Transactional
    public void deixarDeSeguir(Jwt jwt, String nomeUsuario) {
        Usuario pessoa = pessoaComum(jwt);
        Usuario alvo = encontrarMembro(nomeUsuario);
        seguidores.findById(new SeguidorId(pessoa.getId(), alvo.getId())).ifPresent(seguidores::delete);
    }

    @Transactional(readOnly = true)
    public boolean estaSeguindo(Jwt jwt, String nomeUsuario) {
        Usuario pessoa = pessoaComum(jwt);
        Usuario alvo = encontrarMembro(nomeUsuario);
        return seguidores.existsBySeguidorIdAndSeguidoId(pessoa.getId(), alvo.getId());
    }

    @Transactional(readOnly = true)
    public List<PerfilSeguidor> listarSeguidores(String nomeUsuario) {
        Usuario alvo = encontrarMembro(nomeUsuario);
        return seguidores.findBySeguidoIdOrderByDataSeguimentoDesc(alvo.getId()).stream()
                .map(Seguidor::getSeguidor)
                .filter(usuario -> !usuario.isAdministrador())
                .map(PerfilSeguidor::de)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PerfilSeguidor> listarSeguindo(String nomeUsuario) {
        Usuario pessoa = encontrarMembro(nomeUsuario);
        return seguidores.findBySeguidorIdOrderByDataSeguimentoDesc(pessoa.getId()).stream()
                .map(Seguidor::getSeguido)
                .filter(usuario -> !usuario.isAdministrador())
                .map(PerfilSeguidor::de)
                .toList();
    }

    private Usuario pessoaComum(Jwt jwt) {
        Usuario usuario = usuarioService.ativo(jwt);
        if (usuario.isAdministrador()) {
            throw ApiException.proibido("Contas de moderação não podem seguir pessoas.");
        }
        return usuario;
    }

    private Usuario encontrarMembro(String nomeUsuario) {
        Usuario alvo = usuarios.findByNomeUsuario(UsuarioService.normalizarNomeUsuario(nomeUsuario))
                .orElseThrow(() -> ApiException.naoEncontrado("Usuário não encontrado."));
        if (alvo.isAdministrador()) {
            throw ApiException.invalido("Perfis de moderação não podem receber seguidores.");
        }
        return alvo;
    }
}
