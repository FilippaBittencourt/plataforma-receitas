# Mums!

**Receitas testadas por quem realmente cozinhou.**

Uma receita pode parecer ótima na foto e falhar na hora do preparo. O Mums! reúne receitas, avaliações e fotos de resultados reais para ajudar a escolher o que vale cozinhar.

## Como funciona

- **Explore receitas** por nome, categoria, ingrediente ou avaliação da comunidade.
- **Publique uma receita sua** ou traga uma de outra plataforma com o link da fonte. Receitas próprias são publicadas na hora; indicações externas passam pela curadoria.
- **Conte como foi o preparo.** Cada avaliação registra se a receita funcionou e dá notas para medidas, tempo, rendimento, clareza e resultado. Você também pode deixar um comentário e uma foto. Se cozinhar a mesma receita outra vez, registra uma nova avaliação.

As fotos enviadas aparecem na seção **Fotos da comunidade** da receita. O selo **Receita Verificada** exige avaliações de pelo menos 10 pessoas diferentes, nota média de 4 ou mais e sucesso em pelo menos 80% dos preparos avaliados.

## Rodar no computador

Você vai precisar de Node.js, npm, Java 21 e Docker Desktop. Abra dois terminais na pasta do projeto.

No primeiro, inicie a API e o banco de dados:

```bash
cd backend
./mvnw spring-boot:run
```

No segundo, inicie o site:

```bash
npm ci
npm run dev
```

A API usa `http://localhost:8080` e o Vite mostra no terminal o endereço do site, normalmente `http://localhost:5173`. Se a API estiver em outro endereço, configure `VITE_API_URL` no ambiente do front.

## Tecnologias

O front usa React, TypeScript, TanStack Start e Tailwind CSS. A API foi feita com Java 21, Spring Boot e PostgreSQL; o Flyway cuida das mudanças no banco.

Os comandos de teste, as variáveis de ambiente e as rotas da API estão no [README do backend](backend/README.md).

## Sobre o projeto

O Mums! é um trabalho da disciplina de **Projeto de Sistemas** do curso de **Análise e Desenvolvimento de Sistemas**.