UPDATE receita
SET status = 'PENDENTE',
    data_moderacao = NULL
WHERE origem = 'EXTERNA'
  AND status = 'APROVADA';
