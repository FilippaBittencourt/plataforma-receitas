package br.com.cookie.api.receita;

import java.util.List;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.cookie.api.comum.ApiException;
import br.com.cookie.api.receita.ReceitaDtos.ReceitaResumo;
import br.com.cookie.api.usuario.Usuario;
import br.com.cookie.api.usuario.UsuarioService;

@Service
public class FavoritoService {

    private final FavoritoRepository favoritos;
    private final ReceitaService receitas;
    private final UsuarioService usuarios;

    public FavoritoService(FavoritoRepository favoritos, ReceitaService receitas, UsuarioService usuarios) {
        this.favoritos = favoritos;
        this.receitas = receitas;
        this.usuarios = usuarios;
    }

    @Transactional
    public void favoritar(Jwt jwt, Integer idReceita) {
        Usuario usuario = pessoaComum(jwt);
        Receita receita = receitas.aprovada(idReceita);
        FavoritoId id = new FavoritoId(usuario.getId(), receita.getId());
        if (!favoritos.existsById(id)) favoritos.save(new Favorito(usuario, receita));
    }

    @Transactional
    public void remover(Jwt jwt, Integer idReceita) {
        Usuario usuario = pessoaComum(jwt);
        favoritos.deleteById(new FavoritoId(usuario.getId(), idReceita));
    }

    @Transactional(readOnly = true)
    public boolean estaFavorita(Jwt jwt, Integer idReceita) {
        Usuario usuario = pessoaComum(jwt);
        return favoritos.existsById(new FavoritoId(usuario.getId(), idReceita));
    }

    @Transactional(readOnly = true)
    public List<Integer> ids(Jwt jwt) {
        Usuario usuario = pessoaComum(jwt);
        return favoritos.findByUsuarioIdOrderByDataFavoritoDesc(usuario.getId()).stream()
                .map(f -> f.getReceita().getId())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReceitaResumo> listar(Jwt jwt) {
        Usuario usuario = pessoaComum(jwt);
        return favoritos.findByUsuarioIdOrderByDataFavoritoDesc(usuario.getId()).stream()
                .map(Favorito::getReceita)
                .filter(r -> r.getStatus() == StatusReceita.APROVADA)
                .map(ReceitaResumo::de)
                .toList();
    }

    private Usuario pessoaComum(Jwt jwt) {
        Usuario usuario = usuarios.ativo(jwt);
        if (usuario.isAdministrador()) {
            throw ApiException.proibido("Contas de moderação não podem favoritar receitas.");
        }
        return usuario;
    }
}
