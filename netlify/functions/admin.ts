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

  console.log('🚀 Admin function called with path:', event.path);
  console.log('🔍 Query params:', event.queryStringParameters);
  console.log('🌐 HTTP Method:', event.httpMethod);
  console.log('📍 Path includes "login-logs":', event.path?.includes('login-logs'));
  
  try {
    // GET /admin/login-logs - Ajustar para verificar path
    const pathToCheck = event.path || '';
    console.log('🔎 Path being checked:', pathToCheck);
    
    if (event.httpMethod === 'GET' && (pathToCheck.includes('login-logs') || pathToCheck.endsWith('login-logs'))) {
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
      console.log('🔍 Buscando logs recentes...');
      const logs = await storage.getRecentLoginAttempts(100);
      console.log('📊 Logs encontrados:', logs.length, 'entries');
      console.log('📝 Detalhes dos logs:', logs.map(log => ({ 
        id: log.id, 
        email: log.email, 
        success: log.success, 
        timestamp: log.timestamp 
      })));
      
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