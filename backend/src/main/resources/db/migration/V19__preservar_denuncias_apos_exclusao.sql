-- Preserve o histórico de moderação sem manter vínculo com contas excluídas.
ALTER TABLE denuncia
    ADD COLUMN nome_denunciante VARCHAR(150),
    ADD COLUMN nome_usuario_denunciante VARCHAR(30),
    ADD COLUMN nome_denunciado VARCHAR(150),
    ADD COLUMN nome_usuario_denunciado VARCHAR(30);

UPDATE denuncia d
SET nome_denunciante = denunciante.nome,
    nome_usuario_denunciante = denunciante.nome_usuario,
    nome_denunciado = denunciado.nome,
    nome_usuario_denunciado = denunciado.nome_usuario
FROM usuario denunciante, usuario denunciado
WHERE d.id_denunciante = denunciante.id_usuario
  AND d.id_usuario_denunciado = denunciado.id_usuario;

ALTER TABLE denuncia
    ALTER COLUMN nome_denunciante SET NOT NULL,
    ALTER COLUMN nome_usuario_denunciante SET NOT NULL,
    ALTER COLUMN nome_denunciado SET NOT NULL,
    ALTER COLUMN nome_usuario_denunciado SET NOT NULL,
    ALTER COLUMN id_denunciante DROP NOT NULL,
    ALTER COLUMN id_usuario_denunciado DROP NOT NULL;

ALTER TABLE denuncia
    DROP CONSTRAINT fk_denuncia_denunciante,
    DROP CONSTRAINT fk_denuncia_denunciado;

ALTER TABLE denuncia
    ADD CONSTRAINT fk_denuncia_denunciante
        FOREIGN KEY (id_denunciante) REFERENCES usuario(id_usuario) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT fk_denuncia_denunciado
        FOREIGN KEY (id_usuario_denunciado) REFERENCES usuario(id_usuario) ON UPDATE CASCADE ON DELETE SET NULL;
