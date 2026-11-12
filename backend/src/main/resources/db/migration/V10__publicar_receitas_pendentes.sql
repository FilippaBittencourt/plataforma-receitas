-- A aprovação passou a ser automática; receitas antigas em análise tornam-se públicas.
UPDATE receita
SET status = 'APROVADA',
    data_moderacao = COALESCE(data_moderacao, CURRENT_TIMESTAMP)
WHERE status = 'PENDENTE';
