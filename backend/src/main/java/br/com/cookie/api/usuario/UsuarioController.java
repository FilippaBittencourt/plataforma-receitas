package br.com.cookie.api.usuario;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.cookie.api.receita.ReceitaDtos.ReceitaResumo;
import br.com.cookie.api.receita.ReceitaService;
import br.com.cookie.api.usuario.UsuarioDtos.PerfilPublicoResponse;

/** Perfis públicos: /api/usuarios/juliaferraz. */
@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarios;
    private final ReceitaService receitas;

    public UsuarioController(UsuarioService usuarios, ReceitaService receitas) {
        this.usuarios = usuarios;
        this.receitas = receitas;
    }

    @GetMapping("/{nomeUsuario}")
    PerfilPublicoResponse perfil(@PathVariable String nomeUsuario) {
        return usuarios.perfilPublico(nomeUsuario);
    }

    @GetMapping("/{nomeUsuario}/receitas")
    List<ReceitaResumo> receitas(@PathVariable String nomeUsuario) {
        return receitas.publicadasPor(usuarios.perfilPublico(nomeUsuario).id());
    }
}
