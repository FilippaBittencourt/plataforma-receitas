package br.com.cookie.api.demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.security.crypto.password.PasswordEncoder;

import br.com.cookie.api.categoria.Categoria;
import br.com.cookie.api.categoria.CategoriaRepository;
import br.com.cookie.api.receita.Ingrediente;
import br.com.cookie.api.receita.IngredienteRepository;
import br.com.cookie.api.receita.Receita;
import br.com.cookie.api.receita.ReceitaRepository;
import br.com.cookie.api.usuario.Usuario;
import br.com.cookie.api.usuario.UsuarioRepository;

class DadosDemonstracaoTest {

    @Test
    void criaPaoSourdoughEntreAsReceitasDeDemonstracao() throws Exception {
        UsuarioRepository usuarios = mock(UsuarioRepository.class);
        ReceitaRepository receitas = mock(ReceitaRepository.class);
        CategoriaRepository categorias = mock(CategoriaRepository.class);
        IngredienteRepository ingredientes = mock(IngredienteRepository.class);
        PasswordEncoder senhas = mock(PasswordEncoder.class);
        Usuario autora = new Usuario("Marina Duarte", "marinaduarte", "marina@cookie.com", "hash");
        Categoria categoria = mock(Categoria.class);
        List<Receita> salvas = new ArrayList<>();

        when(usuarios.count()).thenReturn(1L);
        when(usuarios.findByNomeUsuario("marinaduarte")).thenReturn(Optional.of(autora));
        when(receitas.findAll()).thenReturn(List.of());
        when(receitas.save(any(Receita.class))).thenAnswer(invocacao -> {
            Receita receita = invocacao.getArgument(0);
            salvas.add(receita);
            return receita;
        });
        when(categorias.findBySlug(any())).thenReturn(Optional.of(categoria));
        when(ingredientes.findByNome(any())).thenReturn(Optional.empty());
        when(ingredientes.save(any(Ingrediente.class))).thenAnswer(invocacao -> invocacao.getArgument(0));

        DadosDemonstracao dados = new DadosDemonstracao(usuarios, receitas, categorias, ingredientes, senhas);
        dados.run(new DefaultApplicationArguments());

        Receita pao = salvas.stream()
                .filter(receita -> receita.getTitulo().equals("Pão sourdough"))
                .findFirst()
                .orElseThrow();
        assertThat(pao.getFotoPrincipal()).isEqualTo("/demo/pao-sourdough.jpg");
        assertThat(pao.getTempoPreparo()).isEqualTo(1080);
        assertThat(pao.getIngredientes()).hasSize(4);
        assertThat(pao.getPassos()).hasSize(8);
    }
}
