import { Handler, HandlerEvent } from '@netlify/functions';
import { storage } from '../../server/storage';

const handler: Handler = async (event: HandlerEvent) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  const path = event.path.replace('/.netlify/functions/users', '');
  const segments = path.split('/').filter(Boolean);
  
  try {
    // GET /users/:id
    if (event.httpMethod === 'GET' && segments.length === 1) {
      const userId = segments[0];
      const user = await storage.getUser(userId);
      
      if (!user) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: "Usuário não encontrado" })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ...user, password: undefined })
      };
    }
    
    // PUT /users/:id
    if (event.httpMethod === 'PUT' && segments.length === 1) {
      const userId = segments[0];
      const updates = JSON.parse(event.body || '{}');
      delete updates.password; // Don't allow password updates
      
      const user = await storage.updateUser(userId, updates);
      if (!user) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: "Usuário não encontrado" })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ...user, password: undefined })
      };
    }
    
    // GET /users/:userId/workouts
    if (event.httpMethod === 'GET' && segments.length === 2 && segments[1] === 'workouts') {
      const userId = segments[0];
      const workouts = await storage.getWorkouts(userId);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(workouts)
      };
    }
    
    // GET /users/:userId/checkins
    if (event.httpMethod === 'GET' && segments.length === 2 && segments[1] === 'checkins') {
      const userId = segments[0];
      const checkins = await storage.getCheckins(userId);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(checkins)
      };
    }
    
    // GET /users/:userId/bookings
    if (event.httpMethod === 'GET' && segments.length === 2 && segments[1] === 'bookings') {
      const userId = segments[0];
      const bookings = await storage.getClassBookings(userId);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(bookings)
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