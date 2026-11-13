package br.com.cookie.api.demo;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import br.com.cookie.api.categoria.CategoriaRepository;
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
    private final PasswordEncoder senhas;

    public DadosDemonstracao(UsuarioRepository usuarios, ReceitaRepository receitas, CategoriaRepository categorias,
            IngredienteRepository ingredientes, PasswordEncoder senhas) {
        this.usuarios = usuarios;
        this.receitas = receitas;
        this.categorias = categorias;
        this.ingredientes = ingredientes;
        this.senhas = senhas;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (usuarios.count() > 0) {
            Usuario autora = usuarios.findByNomeUsuario("marinaduarte")
                    .or(() -> usuarios.findByEmail("marina@cookie.com"))
                    .orElseGet(() -> usuario("Marina Duarte", "marinaduarte", "marina@cookie.com",
                            "Confeiteira caseira. Peso tudo, até o sal."));
            criarReceitasDemonstracao(autora);
            return;
        }
        usuario("Júlia Ferraz", "juliaferraz", "julia@cookie.com",
                "Testo receitas nos fins de semana e anoto tudo. Confio em medidas em gramas.");
        Usuario marina = usuario("Marina Duarte", "marinaduarte", "marina@cookie.com",
                "Confeiteira caseira. Peso tudo, até o sal.");
        Usuario moderacao = usuario("Equipe de Moderação", "moderacao", "moderacao@cookie.com",
                "Curadoria de receitas, fotos e links externos.");
        moderacao.setTipo(TipoUsuario.ADMINISTRADOR);

        criarReceitasDemonstracao(marina);

        log.info("Dados de demonstração criados. Contas: julia@cookie.com, marina@cookie.com e "
                + "moderacao@cookie.com (senha {}).", SENHA);
    }

    private void criarReceitasDemonstracao(Usuario autora) {
        criarSeAusente(receitaKanelbulle(autora));
        criarSeAusente(receitaCroissant(autora));
        criarSeAusente(receitaCarbonara(autora));
        criarSeAusente(receitaMoscowMule(autora));
        criarSeAusente(receitaPaoSourdough(autora));
    }

    private void criarSeAusente(Receita receita) {
        var existente = receitas.findAll().stream()
                .filter(r -> r.getTitulo().equalsIgnoreCase(receita.getTitulo()))
                .findFirst();
        if (existente.isPresent()) {
            if (existente.get().getFotoPrincipal() == null || existente.get().getFotoPrincipal().isBlank()) {
                existente.get().setFotoPrincipal(receita.getFotoPrincipal());
            }
            return;
        }
        receita.moderar(StatusReceita.APROVADA);
        receitas.save(receita);
    }

    private Receita receitaKanelbulle(Usuario autora) {
        return receita(autora, "Kanelbulle", "doces", "/demo/kanelbulle.jpg", 180, "12 unidades",
                Dificuldade.MEDIO, "Pãezinhos macios de massa enriquecida com cardamomo, recheados com manteiga, açúcar e canela. Rende 12 unidades.",
                List.of(
                        item("farinha de trigo", "500", "g", null), item("leite integral", "250", "ml", "morno"),
                        item("fermento biológico fresco", "25", "g", null), item("açúcar", "80", "g", null),
                        item("manteiga sem sal", "75", "g", "amolecida, para a massa"),
                        item("cardamomo em pó", "1", "colher de sopa", null), item("sal", "5", "g", null),
                        item("manteiga sem sal", "75", "g", "amolecida, para o recheio"),
                        item("açúcar", "60", "g", "para o recheio"), item("canela em pó", "2", "colheres de sopa", null),
                        item("ovo", "1", "unidade", "batido, para pincelar"),
                        item("açúcar perolado", "20", "g", "para finalizar")),
                List.of("Dissolva o fermento no leite morno. Junte açúcar, cardamomo, sal, manteiga e farinha aos poucos; sove por cerca de 10 minutos, até a massa ficar lisa e elástica.",
                        "Cubra e deixe crescer em local morno por 60 a 90 minutos, até quase dobrar de volume.",
                        "Misture a manteiga do recheio com o açúcar e a canela. Abra a massa em um retângulo de aproximadamente 40 × 50 cm e espalhe o recheio.",
                        "Dobre a massa ao meio no sentido do comprimento, corte 12 tiras e torça cada uma. Enrole as tiras em nós e coloque em assadeira forrada.",
                        "Cubra e deixe crescer por mais 30 a 45 minutos. Pincele com ovo batido e salpique açúcar perolado.",
                        "Asse em forno preaquecido a 200 °C por 10 a 12 minutos, até dourar. Deixe amornar antes de servir."));
    }

    private Receita receitaCroissant(Usuario autora) {
        return receita(autora, "Croissant", "paes", "/demo/croissant.jpg", 1440, "12 unidades",
                Dificuldade.AVANCADO, "Massa levedada e folhada com manteiga laminada. O preparo inclui descanso refrigerado durante a noite para facilitar a laminação.",
                List.of(item("farinha de trigo", "500", "g", null), item("leite integral", "140", "ml", "gelado"),
                        item("água", "140", "ml", "gelada"), item("fermento biológico fresco", "15", "g", null),
                        item("açúcar", "50", "g", null), item("sal", "10", "g", null),
                        item("manteiga sem sal", "50", "g", "para a massa"),
                        item("manteiga sem sal", "250", "g", "gelada, para laminar"),
                        item("ovo", "1", "unidade", "batido com 1 colher de sopa de água, para pincelar")),
                List.of("Misture farinha, açúcar e sal. Dissolva o fermento na água e no leite frios; junte aos secos com os 50 g de manteiga. Sove só até obter uma massa homogênea.",
                        "Forme um retângulo, cubra e deixe descansar por 30 minutos. Leve à geladeira por 8 a 12 horas.",
                        "Entre duas folhas de papel-manteiga, abra os 250 g de manteiga em um quadrado de cerca de 18 cm. Mantenha refrigerada, mas maleável.",
                        "Abra a massa em um retângulo com o dobro da largura da placa de manteiga. Coloque a manteiga em uma metade e dobre a outra metade sobre ela, selando as bordas.",
                        "Abra com cuidado em um retângulo comprido e faça uma dobra em três. Refrigere por 30 minutos. Repita a abertura e a dobra em três mais duas vezes, refrigerando entre cada volta.",
                        "Abra a massa até cerca de 4 mm de espessura, corte 12 triângulos e enrole da base até a ponta. Disponha em assadeiras com a ponta para baixo.",
                        "Deixe fermentar por 2 a 3 horas em local fresco, até crescer e tremer levemente ao mover a assadeira. Evite calor alto para não derreter a manteiga.",
                        "Pincele com ovo batido e asse a 200 °C por 15 a 18 minutos, até bem dourados. Esfrie sobre uma grade."));
    }

    private Receita receitaCarbonara(Usuario autora) {
        return receita(autora, "Carbonara", "massas", "/demo/carbonara.jpg", 30, "4 porções",
                Dificuldade.MEDIO, "Carbonara romana com guanciale, gemas, Pecorino Romano e pimenta-do-reino. O molho fica cremoso com a água do cozimento, sem creme de leite.",
                List.of(item("espaguete", "400", "g", null), item("guanciale", "150", "g", "em tiras ou cubos"),
                        item("gema de ovo", "4", "unidades", "em temperatura ambiente"),
                        item("ovo", "1", "unidade", "em temperatura ambiente"),
                        item("queijo pecorino romano", "100", "g", "finamente ralado"),
                        item("pimenta-do-reino", "2", "g", "moída na hora, ou a gosto"),
                        item("sal", null, null, "para a água do cozimento, com moderação")),
                List.of("Leve uma panela grande de água à fervura e tempere com pouco sal, pois o guanciale e o queijo já são salgados.",
                        "Enquanto isso, doure o guanciale em frigideira fria, em fogo médio-baixo, por 7 a 9 minutos, até soltar a gordura e ficar crocante. Desligue o fogo.",
                        "Misture as gemas, o ovo inteiro, o Pecorino e bastante pimenta até formar uma pasta espessa.",
                        "Cozinhe o espaguete até ficar al dente. Reserve uma xícara da água do cozimento e escorra a massa.",
                        "Junte a massa à frigideira com o guanciale e misture. Aguarde alguns segundos para a frigideira perder o calor intenso.",
                        "Adicione a mistura de ovos e queijo, mexendo sem parar. Acrescente água do cozimento aos poucos até formar um molho brilhante que envolva a massa. Sirva imediatamente com mais Pecorino e pimenta."));
    }

    private Receita receitaMoscowMule(Usuario autora) {
        return receita(autora, "Moscow Mule", "bebidas", "/demo/moscow-mule.jpg", 5, "1 drink",
                Dificuldade.FACIL, "Coquetel refrescante de vodka, limão e ginger beer, servido bem gelado. A caneca de cobre é tradicional, mas não obrigatória.",
                List.of(item("vodka", "45", "ml", null), item("suco de limão-taiti", "10", "ml", "espremido na hora"),
                        item("ginger beer", "120", "ml", "bem gelada"), item("gelo", "150", "g", "ou o suficiente para encher a caneca"),
                        item("limão", "1", "fatia", "para guarnecer")),
                List.of("Encha uma caneca de cobre ou copo alto com gelo.",
                        "Adicione a vodka e o suco de limão e mexa brevemente.",
                        "Complete com ginger beer gelada e misture com delicadeza para preservar a carbonatação.",
                        "Guarneça com uma fatia de limão e sirva imediatamente."));
    }

    private Receita receitaPaoSourdough(Usuario autora) {
        return receita(autora, "Pão sourdough", "paes", "/demo/pao-sourdough.jpg", 1080,
                "1 pão de aproximadamente 800 g", Dificuldade.DIFICIL,
                "Pão de fermentação natural com casca crocante, miolo aberto e fermentação lenta na geladeira. Use fermento natural ativo, no pico de crescimento.",
                List.of(item("farinha de trigo forte", "500", "g", null),
                        item("água", "350", "ml", "em temperatura ambiente"),
                        item("fermento natural", "100", "g", "ativo e alimentado, com 100% de hidratação"),
                        item("sal", "10", "g", null)),
                List.of("Misture a farinha com a água até não restarem partes secas. Cubra e deixe descansar por 30 a 45 minutos.",
                        "Junte o fermento natural e aperte a massa com os dedos até incorporar. Descanse por 20 minutos, adicione o sal e dobre a massa até distribuí-lo por igual.",
                        "Deixe fermentar em recipiente coberto por 4 a 6 horas, em local ameno. Nas primeiras 2 horas, faça 4 séries de dobras, com 30 minutos de intervalo. Depois, deixe crescer até a massa aumentar cerca de 40% e mostrar bolhas nas laterais.",
                        "Vire a massa sobre a bancada levemente enfarinhada, faça uma pré-modelagem e deixe descansar por 20 minutos. Modele em formato redondo ou oval, criando tensão na superfície.",
                        "Coloque a massa com a emenda para cima em um cesto de fermentação enfarinhado. Cubra e leve à geladeira por 8 a 14 horas.",
                        "Aqueça o forno a 250 °C com uma panela de ferro ou Dutch oven com tampa por pelo menos 45 minutos. Vire a massa sobre papel-manteiga, faça um corte de aproximadamente 1 cm na superfície e transfira com cuidado para a panela quente.",
                        "Asse com a panela tampada por 20 minutos. Retire a tampa, reduza o forno para 230 °C e asse por mais 20 a 25 minutos, até a casca ficar bem dourada.",
                        "Retire o pão da panela e deixe esfriar sobre uma grade por pelo menos 1 hora antes de cortar."));
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

    private Receita receita(Usuario autor, String titulo, String categoria, String foto, int minutos, String rendimento,
            Dificuldade dificuldade, String resumo, List<Item> itens, List<String> passos) {
        var receita = new Receita(Origem.PROPRIA, autor);
        receita.setTitulo(titulo);
        receita.setFotoPrincipal(foto);
        receita.setCategoria(categorias.findBySlug(categoria).orElseThrow());
        receita.setTempoPreparo(minutos);
        receita.setRendimento(rendimento);
        receita.setDificuldade(dificuldade);
        receita.setResumo(resumo);
        for (Item i : itens) {
            String nomeIngrediente = i.nome().toLowerCase(Locale.ROOT);
            Ingrediente ingrediente = ingredientes.findByNome(nomeIngrediente)
                    .orElseGet(() -> ingredientes.save(new Ingrediente(nomeIngrediente)));
            receita.getIngredientes().add(new ItemIngrediente(ingrediente,
                    i.quantidade() == null ? null : new BigDecimal(i.quantidade()), i.unidade(), i.observacao()));
        }
        receita.getPassos().addAll(passos);
        return receita;
    }

}
