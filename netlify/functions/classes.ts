import { Handler, HandlerEvent } from '@netlify/functions';
import { storage } from '../../server/storage';

const handler: Handler = async (event: HandlerEvent) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  const path = event.path.replace('/.netlify/functions/classes', '');
  const segments = path.split('/').filter(Boolean);
  
  try {
    // GET /classes
    if (event.httpMethod === 'GET' && segments.length === 0) {
      const queryParams = event.queryStringParameters || {};
      const { date } = queryParams;
      
      const classes = date ? 
        await storage.getClassesByDate(date) : 
        await storage.getClasses();
        
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(classes)
      };
    }
    
    // POST /classes/:id/book
    if (event.httpMethod === 'POST' && segments.length === 2 && segments[1] === 'book') {
      const classId = segments[0];
      const { userId } = JSON.parse(event.body || '{}');
      
      const cls = await storage.getClass(classId);
      if (!cls) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: "Aula não encontrada" })
        };
      }
      
      if (cls.currentParticipants! >= cls.maxParticipants) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: "Aula lotada" })
        };
      }
      
      const booking = await storage.createClassBooking(userId, classId);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(booking)
      };
    }
    
    // DELETE /classes/:id/book
    if (event.httpMethod === 'DELETE' && segments.length === 2 && segments[1] === 'book') {
      const classId = segments[0];
      const { userId } = JSON.parse(event.body || '{}');
      
      const success = await storage.cancelClassBooking(userId, classId);
      if (!success) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: "Agendamento não encontrado" })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: "Agendamento cancelado com sucesso" })
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