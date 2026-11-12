CREATE TABLE foto_receita (
    id_receita INTEGER NOT NULL,
    ordem INTEGER NOT NULL,
    url_foto VARCHAR(500) NOT NULL,

    PRIMARY KEY (id_receita, ordem),

    CONSTRAINT fk_foto_receita_receita
        FOREIGN KEY (id_receita)
        REFERENCES receita(id_receita)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT chk_foto_receita_ordem
        CHECK (ordem >= 1)
);
