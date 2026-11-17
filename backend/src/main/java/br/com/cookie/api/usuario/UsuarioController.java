package br.com.cookie.api.usuario;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.cookie.api.receita.ReceitaDtos.ReceitaResumo;
import br.com.cookie.api.receita.ReceitaService;
import br.com.cookie.api.usuario.UsuarioDtos.PerfilPublicoResponse;
import br.com.cookie.api.usuario.UsuarioDtos.PerfilSeguidor;

/** Perfis públicos: /api/usuarios/juliaferraz. */
@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarios;
    private final ReceitaService receitas;
    private final SeguidorService seguidores;

    public UsuarioController(UsuarioService usuarios, ReceitaService receitas, SeguidorService seguidores) {
        this.usuarios = usuarios;
        this.receitas = receitas;
        this.seguidores = seguidores;
    }

    @GetMapping("/{nomeUsuario}")
    PerfilPublicoResponse perfil(@PathVariable String nomeUsuario) {
        return usuarios.perfilPublico(nomeUsuario);
    }

    @GetMapping("/{nomeUsuario}/receitas")
    List<ReceitaResumo> receitas(@PathVariable String nomeUsuario) {
        return receitas.publicadasPor(usuarios.perfilPublico(nomeUsuario).id());
    }

    @GetMapping("/{nomeUsuario}/seguidores")
    List<PerfilSeguidor> seguidores(@PathVariable String nomeUsuario) {
        return seguidores.listarSeguidores(nomeUsuario);
    }

    @GetMapping("/{nomeUsuario}/seguindo")
    List<PerfilSeguidor> seguindo(@PathVariable String nomeUsuario) {
        return seguidores.listarSeguindo(nomeUsuario);
    }
}
