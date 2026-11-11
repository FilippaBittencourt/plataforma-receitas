ALTER TABLE usuario ADD COLUMN codigo_recuperacao_hash VARCHAR(64);

-- Tokens de recuperação por e-mail não serão mais usados.
DROP TABLE IF EXISTS token_recuperacao_senha;
