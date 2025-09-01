import { Handler, HandlerEvent } from '@netlify/functions';
import { storage } from './shared/storage';

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

  console.log('Admin function called with path:', event.path);
  console.log('Query params:', event.queryStringParameters);
  
  try {
    // GET /admin/login-logs
    if (event.httpMethod === 'GET' && event.path.includes('login-logs')) {
      const userId = event.queryStringParameters?.userId;
      
      if (!userId) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ message: "Acesso negado" })
        };
      }
      
      // Verificar se o usuário é admin
      const user = await storage.getUser(userId);
      if (!user || !user.isAdmin) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ message: "Apenas administradores podem acessar os logs" })
        };
      }
      
      // Buscar logs recentes
      const logs = await storage.getRecentLoginAttempts(100);
      console.log('Returning logs:', logs.length, 'entries');
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(logs)
      };
    }
    
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ 
        message: 'Route not found',
        requestedPath: event.path,
        method: event.httpMethod 
      })
    };
    
  } catch (error) {
    console.error('Admin function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Erro interno do servidor', error: error.message })
    };
  }
};

export { handler };