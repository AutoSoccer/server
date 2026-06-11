# language: pt
# Feature BDD do modulo de autenticacao.
#
# Mapeamento com o codigo real:
#   - POST /auth/register   -> src/modules/auth/auth.routes.ts (linhas 26-74)
#                              src/modules/auth/auth.service.ts (registerUser, linhas 146-192)
#   - POST /auth/login      -> src/modules/auth/auth.routes.ts (linhas 125-167)
#                              src/modules/auth/auth.service.ts (loginUser, linhas 254-288)
#   - POST /auth/guest      -> src/modules/auth/auth.routes.ts (linhas 106-123)
#                              src/modules/auth/auth.service.ts (createGuest, linhas 204-242)
#   - GET  /auth/me         -> src/modules/auth/auth.routes.ts (linhas 76-104)
#
# Codigos de erro: ServiceError com ErrorCode.Conflict ('CONFLICT') e
# ErrorCode.InvalidCredentials ('INVALID_CREDENTIALS') definidos em
# src/modules/shared/errorCodes.ts.

Funcionalidade: Autenticacao de jogadores
  Como jogador do AutoSoccer
  Quero me autenticar via cadastro, login ou conta de convidado
  Para ter acesso ao mercado, equipe e ao ranking persistente

  Contexto:
    Dado que a API esta disponivel em "http://localhost:3333"
    E ja existe um usuario cadastrado com email "joao@email.com",
      nickname "joao" e senha "senha123"

  Cenario: Login com credenciais validas usando email
    Dado que estou na pagina de login do AutoSoccer
    Quando envio POST para "/auth/login" com o corpo:
      """
      {
        "identifier": "joao@email.com",
        "password": "senha123"
      }
      """
    Entao a resposta tem status 200
    E o corpo contem um campo "token" do tipo string
    E o corpo contem "user.nickname" igual a "joao"
    E o frontend persiste o token e redireciona o jogador para o mercado

  Cenario: Login com credenciais validas usando nickname
    Quando envio POST para "/auth/login" com identifier "joao" e senha "senha123"
    Entao a resposta tem status 200
    E o corpo contem um token JWT assinado com a chave do servidor

  Cenario: Login com senha errada retorna 401
    Quando envio POST para "/auth/login" com identifier "joao@email.com"
      e senha "senhaErrada"
    Entao a resposta tem status 401
    E o corpo contem "code" igual a "INVALID_CREDENTIALS"
    E o frontend mostra a mensagem traduzida de credenciais invalidas

  Cenario: Login com usuario inexistente retorna 401
    Quando envio POST para "/auth/login" com identifier "naoexiste@email.com"
      e senha "qualquer123"
    Entao a resposta tem status 401
    E o corpo contem "code" igual a "INVALID_CREDENTIALS"

  Cenario: Registro de novo usuario com sucesso
    Quando envio POST para "/auth/register" com o corpo:
      """
      {
        "name": "Lucas",
        "nickname": "lucas",
        "password": "senha123",
        "email": "lucas@email.com"
      }
      """
    Entao a resposta tem status 201
    E o corpo contem um token JWT
    E o corpo contem "user.coins" igual ao saldo inicial padrao
    E o corpo contem "user.is_guest" igual a false

  Cenario: Registro com email ja cadastrado retorna 409
    Quando envio POST para "/auth/register" com email "joao@email.com",
      nickname "outroNick", senha "senha123" e nome "Joao 2"
    Entao a resposta tem status 409
    E o corpo contem "code" igual a "CONFLICT"
    E a mensagem traduzida indica que o campo "email" ja esta em uso

  Cenario: Registro com nickname ja cadastrado retorna 409
    Quando envio POST para "/auth/register" com email "novo@email.com",
      nickname "joao", senha "senha123" e nome "Outro Joao"
    Entao a resposta tem status 409
    E o corpo contem "code" igual a "CONFLICT"
    E a mensagem traduzida indica que o campo "nickname" ja esta em uso

  Cenario: Login de convidado cria conta efemera
    Quando envio POST para "/auth/guest" sem corpo
    Entao a resposta tem status 201
    E o corpo contem um token JWT valido
    E o corpo contem "user.is_guest" igual a true
    E o corpo contem "user.coins" igual ao saldo inicial de convidado (GUEST_INITIAL_COINS)
    E o nickname comeca com o prefixo "guest_"

  Cenario: Endpoint protegido sem token retorna 401
    Quando envio GET para "/auth/me" sem header Authorization
    Entao a resposta tem status 401

  Cenario: Endpoint protegido com token valido retorna o perfil
    Dado que o jogador "joao@email.com" obteve um token via POST "/auth/login"
    Quando envio GET para "/auth/me" com header "Authorization: Bearer <token>"
    Entao a resposta tem status 200
    E o corpo contem "nickname" igual a "joao"
    E o corpo contem os campos "victory", "defeat", "trophies" e "coins"

  Cenario: Logout limpa a sessao no frontend
    Dado que o jogador esta autenticado no frontend
    Quando ele clica em "Sair"
    Entao o token JWT e removido do localStorage
    E o jogador e redirecionado para a tela inicial
    E novas chamadas a "/auth/me" retornam 401
