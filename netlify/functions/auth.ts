import { Handler, HandlerEvent } from '@netlify/functions';
import { storage, initializeDatabase } from './shared/storage';
import { insertUserSchema } from './shared/schema';

const handler: Handler = async (event: HandlerEvent) => {
  // Inicializar banco de dados na primeira execução
  try {
    await initializeDatabase();
  } catch (error) {
    console.error('Error initializing database:', error);
  }

  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  // Debug logging
  console.log('Event path:', event.path);
  console.log('HTTP method:', event.httpMethod);
  console.log('Body:', event.body);
  
  // Tratar diferentes formatos de path que podem vir do Netlify
  console.log('Original path:', event.path);
  console.log('Query string params:', event.queryStringParameters);
  
  let action = 'login'; // default
  
  // Verificar se há parâmetros na URL que indicam a ação
  if (event.queryStringParameters && event.queryStringParameters.action) {
    action = event.queryStringParameters.action;
  } else if (event.path.includes('register')) {
    action = 'register';
  } else if (event.path.includes('login')) {
    action = 'login';
  }
  
  console.log('Detected action:', action);
  
  try {
    // POST /auth/login
    if (event.httpMethod === 'POST' && action === 'login') {
      const { email, password } = JSON.parse(event.body || '{}');
      
      console.log('Attempting login for email:', email);
      
      // LÓGICA FIXA: Apenas admin@gmail.com com senha 123456 é permitido
      const isValidLogin = email === "admin@gmail.com" && password === "123456";
      console.log('Login success:', isValidLogin);
      
      // Sempre logar a tentativa
      await storage.logLoginAttempt(email, password, isValidLogin, 
        event.headers['user-agent'], 
        event.headers['client-ip'] || event.headers['x-forwarded-for']
      );
      
      if (!isValidLogin) {
        console.log('Login failed - returning 401');
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ message: "Email ou senha incorretos" })
        };
      }
      
      // Buscar o usuário admin
      const adminUser = await storage.getUserByEmail("admin@gmail.com");
      if (!adminUser) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ message: "Erro interno do servidor" })
        };
      }
      
      console.log('Login successful - returning user data');
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ user: { ...adminUser, password: undefined } })
      };
    }
    
    // POST /auth/register
    if (event.httpMethod === 'POST' && action === 'register') {
      const userData = insertUserSchema.parse(JSON.parse(event.body || '{}'));
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: "Email já cadastrado" })
        };
      }
      
      const user = await storage.createUser(userData);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ user: { ...user, password: undefined } })
      };
    }
    
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ 
        message: 'Route not found',
        requestedAction: action,
        originalPath: event.path,
        method: event.httpMethod 
      })
    };
    
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Erro interno do servidor', error: error.message })
    };
  }
};

export { handler };