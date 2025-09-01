import { Handler, HandlerEvent } from '@netlify/functions';
import { storage } from '../../server/storage';
import { insertUserSchema } from '../../shared/schema';

const handler: Handler = async (event: HandlerEvent) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  const path = event.path.replace('/.netlify/functions/auth', '');
  
  try {
    // POST /auth/login
    if (event.httpMethod === 'POST' && path === '/login') {
      const { email, password } = JSON.parse(event.body || '{}');
      
      const user = await storage.getUserByEmail(email);
      const success = user && user.password === password;
      
      // Log da tentativa de login
      await storage.logLoginAttempt(email, password, !!success, 
        event.headers['user-agent'], 
        event.headers['client-ip'] || event.headers['x-forwarded-for']
      );
      
      if (!success) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ message: "Email ou senha incorretos" })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ user: { ...user, password: undefined } })
      };
    }
    
    // POST /auth/register
    if (event.httpMethod === 'POST' && path === '/register') {
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
      body: JSON.stringify({ message: 'Not found' })
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Erro interno do servidor' })
    };
  }
};

export { handler };