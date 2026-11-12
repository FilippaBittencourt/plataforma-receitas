ALTER TABLE receita DROP CONSTRAINT chk_dificuldade;
ALTER TABLE receita
    ADD CONSTRAINT chk_dificuldade
    CHECK (dificuldade IS NULL OR dificuldade IN ('FACIL', 'MEDIO', 'DIFICIL', 'CHEF', 'AVANCADO'));

ALTER TABLE receita DROP CONSTRAINT chk_faixa_custo;
ALTER TABLE receita
    ADD CONSTRAINT chk_faixa_custo
    CHECK (faixa_custo IS NULL OR faixa_custo IN ('BAIXO', 'MEDIO', 'ALTO', 'MUITO_ALTO'));
