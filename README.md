### NodeJS API Mesagens

**Tecnologias usadas**

- Nodejs
  
- Prisma ORM
  
- Postgres
  
- Typescript
  
- Json Web Token
  
- Express JS
  

#### Gettinn Started

1. **Faça o download do projeto.**
  
  ```bash
  git clone git@github.com:igormachado/node_heat.git
  ```
  
2. **Instalar as dependências do projeto, npm**
  

```bash
cd node_heat
npm install        
```

3 - Realizar um migrate no Prisma ORM.

```bash
npx prisma migrate dev
```

#### Entendendo o projeto NodeJS API mesagens

**GET**

- ***router.get("/profile", profileUserController.handle);***
  
  - Esta rota verifica se o usuário existe.
    
  - ***Listando o usuário***
    

```js

// verifica o user pelo id. No caso o primeiro
class ProfileUserService {
  async execute(user_id: string) {
    const user = await prismaClient.user.findFirst({
      where: {
        id: user_id,
      },
    });

    return user;
  }
}

export { ProfileUserService };
```

- ***router.get("/message/last3", getLast3MessagesController.handle);***
  
  - Esta rota lista as 3 primeiras menssagens do user.
    
  - Ordenando pela menssagem mais recente. Verificando pela data de criação.
    
- ***Lista as 3 primeiras menssagens.***
  

```js
// Lista todos os incomes. Buscando por todos os id.
class GetLast3MessageService {
  async execute() {
    const messages = await prismaClient.message.findMany({
      take: 3,
      orderBy: {
        created_at: "desc",
      },
      include: {
        user: true,
      },
    });

    return messages;
  }
}

export { GetLast3MessageService };
```

- **POST**
  

- ***router.post("/message", ensureAuthenticated, createMessageController.handle);***
  
  - Esta rota cria uma mensagem.
    
  - O user é pego os dados no github caso exista.
    
  - **BODY**:
    
    - *text: string*. Descrição da mensagem
      
    - *user_id: number*. id do usuário.
      
    - *created_at: string*. A data de criação .
      
    - avatar_url: string: foto de perfil do user.
      
  - ***Criando uma mensagem ***
    
  
  ```js
  class CreateMessageService {
    async execute(text: string, user_id: string) {
      const message = await prismaClient.message.create({
        data: {
          text,
          user_id,
        },
        include: {
          user: true,
        },
      });
  
      const infoWS = {
        text: message.text,
        user_id: message.user_id,
        created_at: message.created_at,
        user: {
          name: message.user.name,
          avatar_url: message.user.avatar_url,
        },
      };
  
      io.emit("new_message", infoWS);
  
      return message;
    }
  }
  
  export { CreateMessageService };
  ```
  
- ***router.post("/authenticate", authenticateUserController.handle);***
  
  - Esta rota verifica se o user existe. Se existir fará um sign-in Para enviar mensagem
    
  - ***Verificando se o user existe ou não.***
    

```js
/**
 * Receber code(string)
 * Recuperar o access_token no github
 * Verificar se o usuario existe no DB
 *
 * --- SIM = Gerar um token
 * --- NAO = Criar no DB, gerar um token
 * Retornar o token com as infos do user.
 */

interface IAccessTokenResponse {
  access_token: string;
}

interface IUserResponse {
  avatar_url: string;
  login: string;
  id: number;
  name: string;
}

class AuthenticateUserService {
  async execute(code: string) {
    const url = "https://github.com/login/oauth/access_token";

    // null refere-se ao request.body
    const { data: accessTokenResponse } =
      await axios.post<IAccessTokenResponse>(url, null, {
        params: {
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        },
        // receber aplicacao como JSON
        headers: {
          Accept: "application/json",
        },
      });

    const response = await axios.get<IUserResponse>(
      "https://api.github.com/user",
      {
        headers: {
          authorization: `Bearer ${accessTokenResponse.access_token}`,
        },
      }
    );

    const { login, id, avatar_url, name } = response.data;

    let user = await prismaClient.user.findFirst({
      where: {
        github_id: id,
      },
    });

    if (!user) {
      user = await prismaClient.user.create({
        data: {
          github_id: id,
          login,
          avatar_url,
          name,
        },
      });
    }

    const token = sign(
      {
        user: {
          name: user.name,
          avatar_url: user.avatar_url,
          id: user.id,
        },
      },
      process.env.JWT_SECRET,
      {
        subject: user.id,
        expiresIn: "1d",
      }
    );

    return { token, user };
  }
}

export { AuthenticateUserService };
```

**middleware**

- ***Realiza uma verificação se o user está autenticado para enviar mensagens***
  
  - pegando o token e fazendo comparação ou o token de login.
    

```js
interface IPayload {
  sub: string;
}

export function ensureAuthenticated(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const authToken = request.headers.authorization;

  if (!authToken) {
    return response.status(401).json({ errorCode: "token.invalid" });
  }

  // Bear 5948583asdf
  // [0] Bear
  // [1] 948493asdfasdf token
  const [, token] = authToken.split(" ");

  try {
    const { sub } = verify(token, process.env.JWT_SECRET) as IPayload;

    request.user_id = sub;

    return next();
  } catch (err) {
    return response.status(401).json({ errorCode: "token.expired" });
  }
}
```
