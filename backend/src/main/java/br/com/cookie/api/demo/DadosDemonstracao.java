package br.com.cookie.api.demo;

import java.math.BigDecimal;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import br.com.cookie.api.avaliacao.Avaliacao;
import br.com.cookie.api.avaliacao.AvaliacaoRepository;
import br.com.cookie.api.categoria.CategoriaRepository;
import br.com.cookie.api.comentario.Comentario;
import br.com.cookie.api.comentario.ComentarioRepository;
import br.com.cookie.api.receita.Dificuldade;
import br.com.cookie.api.receita.Ingrediente;
import br.com.cookie.api.receita.IngredienteRepository;
import br.com.cookie.api.receita.ItemIngrediente;
import br.com.cookie.api.receita.Origem;
import br.com.cookie.api.receita.Receita;
import br.com.cookie.api.receita.ReceitaRepository;
import br.com.cookie.api.receita.StatusReceita;
import br.com.cookie.api.usuario.TipoUsuario;
import br.com.cookie.api.usuario.Usuario;
import br.com.cookie.api.usuario.UsuarioRepository;

/**
 * Contas e receitas de demonstração, criadas só quando o banco está vazio (app.demo.ativo=true).
 * Senha de todas as contas: demo1234.
 */
@Component
@ConditionalOnProperty(name = "app.demo.ativo", havingValue = "true")
public class DadosDemonstracao implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DadosDemonstracao.class);
    private static final String SENHA = "demo1234";

    private final UsuarioRepository usuarios;
    private final ReceitaRepository receitas;
    private final CategoriaRepository categorias;
    private final IngredienteRepository ingredientes;
    private final AvaliacaoRepository avaliacoes;
    private final ComentarioRepository comentarios;
    private final PasswordEncoder senhas;

    public DadosDemonstracao(UsuarioRepository usuarios, ReceitaRepository receitas, CategoriaRepository categorias,
            IngredienteRepository ingredientes, AvaliacaoRepository avaliacoes, ComentarioRepository comentarios,
            PasswordEncoder senhas) {
        this.usuarios = usuarios;
        this.receitas = receitas;
        this.categorias = categorias;
        this.ingredientes = ingredientes;
        this.avaliacoes = avaliacoes;
        this.comentarios = comentarios;
        this.senhas = senhas;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (usuarios.count() > 0) {
            return;
        }
        Usuario julia = usuario("Júlia Ferraz", "juliaferraz", "julia@cookie.com",
                "Testo receitas nos fins de semana e anoto tudo. Confio em medidas em gramas.");
        Usuario marina = usuario("Marina Duarte", "marinaduarte", "marina@cookie.com",
                "Confeiteira caseira. Peso tudo, até o sal.");
        Usuario moderacao = usuario("Equipe de Moderação", "moderacao", "moderacao@cookie.com",
                "Curadoria de receitas, fotos e links externos.");
        moderacao.setTipo(TipoUsuario.ADMINISTRADOR);

        Receita cookies = receita(marina, "Cookies de caramelo salgado", "doces", 45, "18 cookies grandes",
                Dificuldade.FACIL,
                "Bordas crocantes, centro macio e um caramelo salgado que não endurece na geladeira.",
                List.of(
                        item("manteiga sem sal", "220", "g", "amolecida"),
                        item("açúcar mascavo claro", "180", "g", null),
                        item("açúcar refinado", "100", "g", null),
                        item("ovo", "2", "unidades", "grandes, cerca de 60 g cada"),
                        item("farinha de trigo", "320", "g", null),
                        item("bicarbonato de sódio", "1", "colher de chá", null),
                        item("chocolate meio amargo", "200", "g", "picado"),
                        item("caramelo salgado", "80", "g", "firme, em cubos"),
                        item("flor de sal", null, null, "para finalizar")),
                List.of(
                        "Bata a manteiga com os açúcares por 3 minutos, até clarear.",
                        "Adicione os ovos um a um, batendo apenas para incorporar.",
                        "Misture a farinha peneirada com o bicarbonato e incorpore com espátula.",
                        "Junte o chocolate e os cubos de caramelo. Leve à geladeira por 30 minutos.",
                        "Porcione bolas de 60 g e asse a 180 °C por 11 a 13 minutos.",
                        "Finalize com flor de sal e deixe firmar 10 minutos na assadeira."));
        cookies.moderar(StatusReceita.APROVADA);

        Receita pao = receita(marina, "Pão rústico de fermentação natural", "paes", 1440, "1 pão de 900 g",
                Dificuldade.AVANCADO, "Casca crocante e miolo aberto, com tempos testados em cozinha doméstica.",
                List.of(
                        item("farinha de trigo", "500", "g", null),
                        item("água", "350", "ml", "em temperatura ambiente"),
                        item("levain", "100", "g", "ativo"),
                        item("sal", "10", "g", null)),
                List.of(
                        "Misture a farinha e a água e descanse por 1 hora (autólise).",
                        "Junte o levain e o sal e faça 4 séries de dobras a cada 30 minutos.",
                        "Modele, coloque no cesto e leve à geladeira por 12 a 16 horas.",
                        "Asse em panela tampada a 250 °C por 20 minutos e destampada por mais 25."));
        pao.moderar(StatusReceita.APROVADA);

        Receita bolo = receita(julia, "Bolo de cenoura sem glúten", "doces", 60, "1 forma de 22 cm",
                Dificuldade.FACIL, "Versão sem glúten testada três vezes antes de publicar.",
                List.of(
                        item("cenoura", "300", "g", "descascada"),
                        item("ovo", "3", "unidades", null),
                        item("óleo", "180", "ml", null),
                        item("açúcar refinado", "240", "g", null),
                        item("farinha de arroz", "240", "g", null),
                        item("fermento químico", "1", "colher de sopa", null)),
                List.of(
                        "Bata a cenoura, os ovos e o óleo no liquidificador.",
                        "Misture com o açúcar e a farinha de arroz; por último, o fermento.",
                        "Asse a 180 °C por 40 minutos."));

        Receita indicada = new Receita(Origem.EXTERNA, julia);
        indicada.setTitulo("Pão de queijo mineiro");
        indicada.setUrlFonte("https://blogdacozinha.com/pao-de-queijo");
        indicada.setResumo("Fiz duas vezes e as medidas bateram perfeitamente.");
        indicada.setCategoria(categorias.findBySlug("paes").orElseThrow());

        receitas.saveAll(List.of(cookies, pao, bolo, indicada));

        avaliar(cookies, julia, true, 5, 5, 4, 5, 5);
        avaliar(cookies, moderacao, true, 5, 4, 5, 5, 5);
        avaliar(pao, julia, true, 5, 3, 5, 4, 5);
        comentarios.save(new Comentario(cookies, julia, "Segui exatamente as medidas e saíram idênticos à foto. "
                + "O descanso de 30 minutos faz toda a diferença.", null));

        log.info("Dados de demonstração criados. Contas: julia@cookie.com, marina@cookie.com e "
                + "moderacao@cookie.com (senha {}).", SENHA);
    }

    private Usuario usuario(String nome, String nomeUsuario, String email, String bio) {
        var usuario = new Usuario(nome, nomeUsuario, email, senhas.encode(SENHA));
        usuario.setBio(bio);
        return usuarios.save(usuario);
    }

    private record Item(String nome, String quantidade, String unidade, String observacao) {
    }

    private static Item item(String nome, String quantidade, String unidade, String observacao) {
        return new Item(nome, quantidade, unidade, observacao);
    }

    private Receita receita(Usuario autor, String titulo, String categoria, int minutos, String rendimento,
            Dificuldade dificuldade, String resumo, List<Item> itens, List<String> passos) {
        var receita = new Receita(Origem.PROPRIA, autor);
        receita.setTitulo(titulo);
        receita.setCategoria(categorias.findBySlug(categoria).orElseThrow());
        receita.setTempoPreparo(minutos);
        receita.setRendimento(rendimento);
        receita.setDificuldade(dificuldade);
        receita.setResumo(resumo);
        for (Item i : itens) {
            Ingrediente ingrediente = ingredientes.findByNome(i.nome())
                    .orElseGet(() -> ingredientes.save(new Ingrediente(i.nome())));
            receita.getIngredientes().add(new ItemIngrediente(ingrediente,
                    i.quantidade() == null ? null : new BigDecimal(i.quantidade()), i.unidade(), i.observacao()));
        }
        receita.getPassos().addAll(passos);
        return receita;
    }

    private void avaliar(Receita receita, Usuario usuario, boolean funcionou, int... notas) {
        var avaliacao = new Avaliacao(receita, usuario);
        avaliacao.registrar(funcionou, notas[0], notas[1], notas[2], notas[3], notas[4]);
        avaliacoes.save(avaliacao);
    }
}
