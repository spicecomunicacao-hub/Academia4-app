import { Handler, HandlerEvent } from '@netlify/functions';
import { storage, initializeDatabase } from './shared/storage';
import { insertUserSchema } from './shared/schema';

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

  // Debug logging
  console.log('Event path:', event.path);
  console.log('HTTP method:', event.httpMethod);
  console.log('Body:', event.body);
  
  console.log('Processing auth request for path:', event.path);
  
  try {
    // Para Netlify, o path será "/login" quando chamado via /api/auth/login
    // ou apenas "/" quando chamado diretamente via /api/auth
    const isLoginRequest = event.httpMethod === 'POST';
    
    if (isLoginRequest) {
      console.log('🔐 Processing login request');
      
      const { email, password } = JSON.parse(event.body || '{}');
      console.log('📧 Login attempt for email:', email);
      
      // LÓGICA FIXA: Apenas admin@gmail.com com senha 123456 é permitido
      const isValidLogin = email === "admin@gmail.com" && password === "123456";
      console.log('✅ Credentials valid:', isValidLogin);
      
      // Sempre logar a tentativa
      try {
        console.log('📝 Logging login attempt...');
        await storage.logLoginAttempt(email, password, isValidLogin, 
          event.headers['user-agent'], 
          event.headers['client-ip'] || event.headers['x-forwarded-for']
        );
        console.log('✅ Login attempt logged successfully');
      } catch (logError) {
        console.error('⚠️ Warning: Failed to log login attempt:', logError);
        // Continue execution even if logging fails
      }
      
      if (!isValidLogin) {
        console.log('❌ Login failed - returning 401');
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ message: "Email ou senha incorretos" })
        };
      }
      
      // Buscar o usuário admin com fallback para criação
      console.log('👤 Looking for admin user...');
      let adminUser = null;
      
      try {
        adminUser = await storage.getUserByEmail("admin@gmail.com");
        console.log('👤 Admin user found:', !!adminUser);
      } catch (error) {
        console.error('❌ Error finding admin user:', error);
      }
      
      // Se não encontrou o admin, criar automaticamente
      if (!adminUser) {
        console.log('🔨 Creating admin user...');
        try {
          adminUser = await storage.createUser({
            name: 'Administrador',
            email: 'admin@gmail.com',
            password: '123456',
            phone: null,
            birthDate: null,
            currentWeight: null,
            targetWeight: null,
            primaryGoal: null,
            planId: 'premium',
            isAdmin: true
          });
          console.log('✅ Admin user created successfully:', adminUser.id);
        } catch (createError) {
          console.error('❌ Failed to create admin user:', createError);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: "Erro interno do servidor - failed to create admin user" })
          };
        }
      }
      
      if (!adminUser) {
        console.error('❌ Admin user still null after creation attempt');
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ message: "Erro interno do servidor - admin user not found" })
        };
      }
      
      console.log('✅ Login successful - returning user data');
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ user: { ...adminUser, password: undefined } })
      };
    }
    
    // POST /auth/register
    if (event.httpMethod === 'POST' && event.path.includes('register')) {
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