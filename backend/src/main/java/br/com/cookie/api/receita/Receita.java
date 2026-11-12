package br.com.cookie.api.receita;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.ListIndexBase;

import br.com.cookie.api.categoria.Categoria;
import br.com.cookie.api.usuario.Usuario;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "receita")
public class Receita {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_receita")
    private Integer id;

    @Column(nullable = false, length = 200)
    private String titulo;

    @Column(columnDefinition = "text")
    private String resumo;

    @Column(name = "foto_principal", length = 500)
    private String fotoPrincipal;

    @Column(length = 100)
    private String rendimento;

    /** Em minutos. */
    @Column(name = "tempo_preparo")
    private Integer tempoPreparo;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Dificuldade dificuldade;

    @Enumerated(EnumType.STRING)
    @Column(name = "faixa_custo", length = 20)
    private FaixaCusto faixaCusto;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Origem origem = Origem.PROPRIA;

    @Column(name = "url_fonte", length = 1000)
    private String urlFonte;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusReceita status = StatusReceita.APROVADA;

    @Column(name = "data_publicacao", nullable = false, updatable = false)
    private Instant dataPublicacao;

    @Column(name = "data_moderacao")
    private Instant dataModeracao;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_categoria", nullable = false)
    private Categoria categoria;

    /** Nulo quando o autor excluiu a conta (ON DELETE SET NULL). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario")
    private Usuario autor;

    // Tabela UTILIZA: a chave (id_receita, ordem) é a posição do item na lista, começando em 1.
    @ElementCollection
    @CollectionTable(name = "utiliza", joinColumns = @JoinColumn(name = "id_receita"))
    @OrderColumn(name = "ordem")
    @ListIndexBase(1)
    private List<ItemIngrediente> ingredientes = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "passo_preparo", joinColumns = @JoinColumn(name = "id_receita"))
    @OrderColumn(name = "ordem")
    @ListIndexBase(1)
    @Column(name = "descricao", nullable = false, columnDefinition = "text")
    private List<String> passos = new ArrayList<>();

    // Linha da view RECEITA_ESTATISTICA com a mesma chave; somente leitura.
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_receita", referencedColumnName = "id_receita", insertable = false, updatable = false)
    private ReceitaEstatistica estatistica;

    protected Receita() {
    }

    public Receita(Origem origem, Usuario autor) {
        this.origem = origem;
        this.autor = autor;
    }

    @PrePersist
    void aoCriar() {
        if (dataPublicacao == null) {
            dataPublicacao = Instant.now();
        }
    }

    public boolean isDoAutor(Usuario usuario) {
        return autor != null && autor.getId().equals(usuario.getId());
    }

    public void moderar(StatusReceita novoStatus) {
        this.status = novoStatus;
        this.dataModeracao = Instant.now();
    }

    public Integer getId() {
        return id;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getResumo() {
        return resumo;
    }

    public void setResumo(String resumo) {
        this.resumo = resumo;
    }

    public String getFotoPrincipal() {
        return fotoPrincipal;
    }

    public void setFotoPrincipal(String fotoPrincipal) {
        this.fotoPrincipal = fotoPrincipal;
    }

    public String getRendimento() {
        return rendimento;
    }

    public void setRendimento(String rendimento) {
        this.rendimento = rendimento;
    }

    public Integer getTempoPreparo() {
        return tempoPreparo;
    }

    public void setTempoPreparo(Integer tempoPreparo) {
        this.tempoPreparo = tempoPreparo;
    }

    public Dificuldade getDificuldade() {
        return dificuldade;
    }

    public void setDificuldade(Dificuldade dificuldade) {
        this.dificuldade = dificuldade;
    }

    public FaixaCusto getFaixaCusto() {
        return faixaCusto;
    }

    public void setFaixaCusto(FaixaCusto faixaCusto) {
        this.faixaCusto = faixaCusto;
    }

    public Origem getOrigem() {
        return origem;
    }

    public String getUrlFonte() {
        return urlFonte;
    }

    public void setUrlFonte(String urlFonte) {
        this.urlFonte = urlFonte;
    }

    public StatusReceita getStatus() {
        return status;
    }

    public Instant getDataPublicacao() {
        return dataPublicacao;
    }

    public Instant getDataModeracao() {
        return dataModeracao;
    }

    public Categoria getCategoria() {
        return categoria;
    }

    public void setCategoria(Categoria categoria) {
        this.categoria = categoria;
    }

    public Usuario getAutor() {
        return autor;
    }

    public List<ItemIngrediente> getIngredientes() {
        return ingredientes;
    }

    public List<String> getPassos() {
        return passos;
    }

    public ReceitaEstatistica getEstatistica() {
        return estatistica;
    }
}
