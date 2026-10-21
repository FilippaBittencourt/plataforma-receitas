-- ============================================================
-- Script - Banco de Dados
-- Sistema de Avaliação de Receitas
-- Filippa Bittencourt
--
-- Banco de dados: PostgreSQL 16
--
-- Revisão do script original. As mudanças estão marcadas com
-- "MUDANÇA:" e o motivo de cada uma vem logo abaixo.
-- ============================================================

-- MUDANÇA: extensão para busca por trecho do título (ILIKE '%bolo%').
-- Um índice B-tree comum em "titulo" não é usado nesse tipo de busca.
CREATE EXTENSION IF NOT EXISTS pg_trgm;


-- ============================================================
-- 1. TABELA: CATEGORIA
-- ============================================================

CREATE TABLE categoria (
    -- MUDANÇA: IDENTITY no lugar de SERIAL (padrão SQL, recomendado desde o PostgreSQL 10).
    id_categoria INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    nome VARCHAR(100) NOT NULL UNIQUE,

    -- MUDANÇA: identificador amigável para URLs e filtros (ex.: "paes" em /buscar?categoria=paes).
    slug VARCHAR(100) NOT NULL UNIQUE,

    CONSTRAINT chk_categoria_slug
        CHECK (slug ~ '^[a-z0-9-]+$')
);


-- ============================================================
-- 2. TABELA: USUARIO
-- ============================================================

CREATE TABLE usuario (
    id_usuario INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    nome VARCHAR(150) NOT NULL,

    -- MUDANÇA: guardado sem "@", em minúsculas, com formato validado.
    nome_usuario VARCHAR(30) NOT NULL UNIQUE,

    -- MUDANÇA: sempre em minúsculas, para "Ana@x.com" e "ana@x.com" não virarem duas contas.
    email VARCHAR(150) NOT NULL UNIQUE,

    -- MUDANÇA: renomeada de "senha" para deixar claro que guarda o HASH (BCrypt), nunca a senha.
    senha_hash VARCHAR(255) NOT NULL,

    foto_perfil VARCHAR(500),

    -- MUDANÇA: limite de 160 caracteres, igual ao da tela de configurações.
    bio VARCHAR(160),

    -- MUDANÇA: TIMESTAMPTZ guarda o fuso horário; TIMESTAMP sem fuso gera horários errados
    -- quando servidor e usuário estão em fusos diferentes.
    data_cadastro TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    tipo_usuario VARCHAR(20) NOT NULL DEFAULT 'USUARIO',

    -- MUDANÇA: necessário para a moderação suspender usuários.
    status VARCHAR(20) NOT NULL DEFAULT 'ATIVO',

    -- MUDANÇA: preferências de notificação da tela de configurações.
    notif_avaliacoes BOOLEAN NOT NULL DEFAULT TRUE,
    notif_comentarios BOOLEAN NOT NULL DEFAULT TRUE,
    notif_novidades BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT chk_tipo_usuario
        CHECK (tipo_usuario IN ('USUARIO', 'ADMINISTRADOR')),

    CONSTRAINT chk_status_usuario
        CHECK (status IN ('ATIVO', 'SUSPENSO')),

    CONSTRAINT chk_nome_usuario
        CHECK (nome_usuario ~ '^[a-z0-9_.]{3,30}$'),

    CONSTRAINT chk_email_minusculo
        CHECK (email = lower(email))
);


-- ============================================================
-- 3. TABELA: RECEITA
-- ============================================================

CREATE TABLE receita (
    id_receita INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    titulo VARCHAR(200) NOT NULL,

    resumo TEXT,

    -- MUDANÇA: "modo_preparo TEXT" saiu daqui e virou a tabela PASSO_PREPARO (seção 6),
    -- porque a plataforma trabalha com passos numerados.

    foto_principal VARCHAR(500),

    rendimento VARCHAR(100),

    -- Tempo em minutos.
    tempo_preparo INTEGER,

    -- MUDANÇA: nova coluna, exibida na página da receita.
    dificuldade VARCHAR(20),

    -- MUDANÇA: valores fixos. PROPRIA = publicada aqui; EXTERNA = indicada por link.
    origem VARCHAR(20) NOT NULL DEFAULT 'PROPRIA',

    url_fonte VARCHAR(1000),

    -- MUDANÇA: toda receita passa pela curadoria antes de aparecer no site.
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',

    data_publicacao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- MUDANÇA: quando a moderação aprovou ou recusou (usado no painel "aprovadas hoje").
    data_moderacao TIMESTAMPTZ,

    id_categoria INTEGER NOT NULL,

    -- MUDANÇA: aceita NULL. Se o autor excluir a conta, a receita continua no site sem autor.
    id_usuario INTEGER,

    CONSTRAINT fk_receita_categoria
        FOREIGN KEY (id_categoria)
        REFERENCES categoria(id_categoria)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    -- MUDANÇA: ON DELETE SET NULL no lugar de CASCADE. Com CASCADE, excluir um usuário
    -- apagaria todas as receitas dele, junto com as avaliações e comentários da comunidade.
    CONSTRAINT fk_receita_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    -- MUDANÇA: "> 0" no lugar de ">= 0"; uma receita de 0 minutos não faz sentido.
    CONSTRAINT chk_tempo_preparo
        CHECK (tempo_preparo IS NULL OR tempo_preparo > 0),

    CONSTRAINT chk_titulo
        CHECK (char_length(trim(titulo)) >= 3),

    CONSTRAINT chk_dificuldade
        CHECK (dificuldade IS NULL OR dificuldade IN ('FACIL', 'MEDIO', 'AVANCADO')),

    CONSTRAINT chk_origem
        CHECK (origem IN ('PROPRIA', 'EXTERNA')),

    -- Receita externa precisa do link; receita própria não tem link.
    CONSTRAINT chk_url_fonte
        CHECK ((origem = 'EXTERNA') = (url_fonte IS NOT NULL)),

    CONSTRAINT chk_status_receita
        CHECK (status IN ('PENDENTE', 'APROVADA', 'RECUSADA'))
);


-- ============================================================
-- 4. TABELA: INGREDIENTE
-- ============================================================

CREATE TABLE ingrediente (
    id_ingrediente INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    -- MUDANÇA: guardado em minúsculas, para "Açúcar" e "açúcar" serem o mesmo ingrediente.
    nome VARCHAR(150) NOT NULL UNIQUE,

    CONSTRAINT chk_ingrediente_nome
        CHECK (nome = lower(nome) AND char_length(trim(nome)) > 0)
);


-- ============================================================
-- 5. TABELA: UTILIZA
-- Relação entre RECEITA e INGREDIENTE
-- ============================================================

CREATE TABLE utiliza (
    id_receita INTEGER NOT NULL,

    -- MUDANÇA: posição do ingrediente na lista (1, 2, 3...).
    ordem INTEGER NOT NULL,

    id_ingrediente INTEGER NOT NULL,

    quantidade NUMERIC(10,3),

    unidade_medida VARCHAR(50),

    -- MUDANÇA: complemento livre, ex.: "amolecida", "a gosto", "para polvilhar".
    observacao VARCHAR(200),

    -- MUDANÇA: a chave era (id_receita, id_ingrediente), o que impedia repetir um ingrediente
    -- na mesma receita (ex.: açúcar na massa e açúcar na calda) e não guardava a ordem.
    PRIMARY KEY (id_receita, ordem),

    CONSTRAINT fk_utiliza_receita
        FOREIGN KEY (id_receita)
        REFERENCES receita(id_receita)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_utiliza_ingrediente
        FOREIGN KEY (id_ingrediente)
        REFERENCES ingrediente(id_ingrediente)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    -- MUDANÇA: "> 0" no lugar de ">= 0"; para "a gosto", deixa-se a quantidade NULL.
    CONSTRAINT chk_quantidade
        CHECK (quantidade IS NULL OR quantidade > 0),

    CONSTRAINT chk_utiliza_ordem
        CHECK (ordem >= 1)
);


-- ============================================================
-- 6. TABELA: PASSO_PREPARO
-- MUDANÇA: tabela nova, substitui a coluna receita.modo_preparo.
-- ============================================================

CREATE TABLE passo_preparo (
    id_receita INTEGER NOT NULL,

    ordem INTEGER NOT NULL,

    descricao TEXT NOT NULL,

    PRIMARY KEY (id_receita, ordem),

    CONSTRAINT fk_passo_receita
        FOREIGN KEY (id_receita)
        REFERENCES receita(id_receita)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT chk_passo_ordem
        CHECK (ordem >= 1),

    CONSTRAINT chk_passo_descricao
        CHECK (char_length(trim(descricao)) > 0)
);


-- ============================================================
-- 7. TABELA: AVALIA
-- Um usuário pode avaliar uma receita apenas uma vez.
-- A chave primária composta garante essa regra.
-- ============================================================

CREATE TABLE avalia (
    id_receita INTEGER NOT NULL,

    id_usuario INTEGER NOT NULL,

    -- MUDANÇA: resposta de "A receita funcionou para você?". É a base da taxa de sucesso.
    funcionou BOOLEAN NOT NULL,

    nota_medidas SMALLINT NOT NULL,

    nota_tempo SMALLINT NOT NULL,

    nota_rendimento SMALLINT NOT NULL,

    nota_clareza SMALLINT NOT NULL,

    nota_resultado SMALLINT NOT NULL,

    data_avaliacao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id_receita, id_usuario),

    CONSTRAINT fk_avalia_receita
        FOREIGN KEY (id_receita)
        REFERENCES receita(id_receita)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_avalia_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    -- MUDANÇA: as notas não tinham limite; agora vão de 1 a 5 estrelas.
    CONSTRAINT chk_notas
        CHECK (
            nota_medidas    BETWEEN 1 AND 5 AND
            nota_tempo      BETWEEN 1 AND 5 AND
            nota_rendimento BETWEEN 1 AND 5 AND
            nota_clareza    BETWEEN 1 AND 5 AND
            nota_resultado  BETWEEN 1 AND 5
        )
);


-- ============================================================
-- 8. TABELA: COMENTA
-- Um usuário pode fazer vários comentários na mesma receita.
-- ============================================================

CREATE TABLE comenta (
    id_comentario INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_receita INTEGER NOT NULL,

    id_usuario INTEGER NOT NULL,

    foto_resultado VARCHAR(500),

    data_comentario TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    texto TEXT NOT NULL,

    -- MUDANÇA: a moderação pode ocultar comentários ofensivos sem apagá-los.
    status VARCHAR(20) NOT NULL DEFAULT 'VISIVEL',

    CONSTRAINT fk_comenta_receita
        FOREIGN KEY (id_receita)
        REFERENCES receita(id_receita)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_comenta_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT chk_comenta_texto
        CHECK (char_length(trim(texto)) > 0),

    CONSTRAINT chk_status_comentario
        CHECK (status IN ('VISIVEL', 'OCULTO'))
);


-- ============================================================
-- 9. TABELA: DENUNCIA
-- MUDANÇA: tabela nova, para a "moderação de conteúdos e usuários".
-- Uma denúncia é sempre contra um usuário e, opcionalmente,
-- aponta o comentário que motivou a denúncia.
-- ============================================================

CREATE TABLE denuncia (
    id_denuncia INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_denunciante INTEGER NOT NULL,

    id_usuario_denunciado INTEGER NOT NULL,

    id_comentario INTEGER,

    motivo VARCHAR(500) NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'ABERTA',

    data_denuncia TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_denuncia_denunciante
        FOREIGN KEY (id_denunciante)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_denuncia_denunciado
        FOREIGN KEY (id_usuario_denunciado)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_denuncia_comentario
        FOREIGN KEY (id_comentario)
        REFERENCES comenta(id_comentario)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT chk_denuncia_propria
        CHECK (id_denunciante <> id_usuario_denunciado),

    CONSTRAINT chk_status_denuncia
        CHECK (status IN ('ABERTA', 'RESOLVIDA'))
);


-- ============================================================
-- 10. VIEW: RECEITA_ESTATISTICA
-- MUDANÇA: view nova. Calcula as médias, a taxa de sucesso e o selo
-- "Receita Verificada" a partir das avaliações, sem duplicar dados.
--
-- Regra da Receita Verificada:
--   - pelo menos 10 avaliações;
--   - média geral (dos 5 critérios) de pelo menos 4,0;
--   - pelo menos 80% das pessoas disseram que a receita funcionou.
-- ============================================================

CREATE VIEW receita_estatistica AS
SELECT
    r.id_receita,
    COUNT(a.id_usuario)::INTEGER                              AS total_avaliacoes,
    (COUNT(a.id_usuario) FILTER (WHERE a.funcionou))::INTEGER AS total_sucesso,
    ROUND(AVG(a.nota_medidas), 2)                             AS media_medidas,
    ROUND(AVG(a.nota_tempo), 2)                               AS media_tempo,
    ROUND(AVG(a.nota_rendimento), 2)                          AS media_rendimento,
    ROUND(AVG(a.nota_clareza), 2)                             AS media_clareza,
    ROUND(AVG(a.nota_resultado), 2)                           AS media_resultado,
    ROUND(AVG((a.nota_medidas + a.nota_tempo + a.nota_rendimento
               + a.nota_clareza + a.nota_resultado) / 5.0), 2) AS media_geral,
    ROUND(100.0 * COUNT(a.id_usuario) FILTER (WHERE a.funcionou)
          / NULLIF(COUNT(a.id_usuario), 0), 1)                AS taxa_sucesso,
    COALESCE(
        COUNT(a.id_usuario) >= 10
        AND AVG((a.nota_medidas + a.nota_tempo + a.nota_rendimento
                 + a.nota_clareza + a.nota_resultado) / 5.0) >= 4.0
        AND COUNT(a.id_usuario) FILTER (WHERE a.funcionou) >= 0.8 * COUNT(a.id_usuario),
        FALSE)                                                AS verificada
FROM receita r
LEFT JOIN avalia a ON a.id_receita = r.id_receita
GROUP BY r.id_receita;


-- ============================================================
-- 11. ÍNDICES
-- ============================================================

CREATE INDEX idx_receita_categoria
    ON receita(id_categoria);

CREATE INDEX idx_receita_usuario
    ON receita(id_usuario);

-- MUDANÇA: listagens do site sempre filtram por status e ordenam por data.
CREATE INDEX idx_receita_status_data
    ON receita(status, data_publicacao DESC);

-- MUDANÇA: índice trigram no lugar do B-tree; atende ILIKE '%trecho%'.
CREATE INDEX idx_receita_titulo
    ON receita USING GIN (titulo gin_trgm_ops);

-- MUDANÇA: permite buscar receitas por ingrediente.
CREATE INDEX idx_utiliza_ingrediente
    ON utiliza(id_ingrediente);

CREATE INDEX idx_avalia_usuario
    ON avalia(id_usuario);

-- MUDANÇA: removido "idx_avalia_receita". A chave primária (id_receita, id_usuario)
-- já começa por id_receita, então o índice era repetido.

CREATE INDEX idx_comenta_usuario
    ON comenta(id_usuario);

-- MUDANÇA: "idx_comenta_receita" e "idx_comenta_data" viraram um índice composto,
-- que atende a consulta real: comentários de uma receita, do mais novo ao mais antigo.
CREATE INDEX idx_comenta_receita_data
    ON comenta(id_receita, data_comentario DESC);

CREATE INDEX idx_denuncia_denunciado
    ON denuncia(id_usuario_denunciado)
    WHERE status = 'ABERTA';
