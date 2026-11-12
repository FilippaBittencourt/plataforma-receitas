ALTER TABLE receita ADD COLUMN faixa_custo VARCHAR(20);

ALTER TABLE receita
    ADD CONSTRAINT chk_faixa_custo
    CHECK (faixa_custo IS NULL OR faixa_custo IN ('BAIXO', 'MEDIO', 'ALTO'));
