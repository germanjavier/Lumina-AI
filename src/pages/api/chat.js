import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

const MODELS = {
  'llama-3.1-8b-instant': 'llama-3.1-8b-instant',
  'llama-3.1-70b-versatile': 'llama-3.1-70b-versatile', 
  'mixtral-8x7b-32768': 'mixtral-8x7b-32768',
  'gemma2-9b-it': 'gemma2-9b-it',
  'gpt-oss-20b': 'openai/gpt-oss-20b',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  const contentType = req.headers['content-type'];
  if (!contentType || !contentType.includes('application/json')) {
    return res.status(400).json({
      success: false,
      error: 'Content-Type must be application/json'
    });
  }

  try {
    const { message, model = 'llama-3.1-8b-instant', messages = [] } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Message is required and must be a non-empty string' 
      });
    }

    if (!MODELS[model]) {
      return res.status(400).json({ 
        success: false,
        error: `Modelo inválido. Modelos disponibles: ${Object.keys(MODELS).join(', ')}` 
      });
    }

    const trimmedMessage = message.trim();

    // 🎭 PERSONALIDAD ACTUALIZADA - RESPUESTAS CORTAS Y TÉCNICAS
    const luminaPrompt = `Eres Lumina, asistente técnico especializado en programación e ingeniería.

DIRECTIVAS ESTRICTAS:
- Responde SIEMPRE en español
- Sé concisa y directa
- Enfócate en código y soluciones prácticas
- Explicaciones breves, solo si son necesarias
- Prioriza ejemplos de código sobre texto
- Máximo 2-3 párrafos para explicaciones
- Sin rodeos, al grano

ESPECIALIDADES:
- Programación: JavaScript, Python, React, Node.js, etc.
- Ingeniería: algoritmos, arquitectura, optimización
- DevOps: Docker, Kubernetes, CI/CD
- Bases de datos: SQL, NoSQL, optimización

ESTILO:
- Técnico y preciso
- Respuestas accionables
- Código bien formateado y comentado
- Sin florituras, solo sustancia
- Identifica el problema y da solución directa

EJEMPLO:
Usuario: "¿Cómo optimizo una query SQL?"
Tú: "Usa EXPLAIN ANALYZE primero. Luego:

\`\`\`sql
-- Índices para búsquedas frecuentes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_date ON orders(created_at);

-- Query optimizada
SELECT u.name, o.total 
FROM users u
JOIN orders o ON u.id = o.user_id 
WHERE u.email = ? AND o.created_at > NOW() - INTERVAL 30 DAY;
\`\`\`

Considera particionamiento para tablas grandes."`;

    const conversation = [
      {
        role: 'system',
        content: luminaPrompt
      },
      ...messages.slice(-8),
      { 
        role: 'user', 
        content: trimmedMessage 
      }
    ];

    const completion = await groq.chat.completions.create({
      model: MODELS[model],
      messages: conversation,
      temperature: 0.7,
      max_tokens: 1024, // Reducido para respuestas más concisas
      top_p: 0.8,
      stream: false,
    });

    const response = completion.choices[0]?.message?.content;
    const usage = completion.usage;

    res.status(200).json({
      success: true,
      response: response,
      model: completion.model,
      usage: usage,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ ERROR:', error);
    
    let errorMessage = 'Error interno del servidor';
    let statusCode = 500;

    if (error.status === 400) errorMessage = 'Solicitud inválida';
    else if (error.status === 401) errorMessage = 'API key inválida';
    else if (error.status === 429) errorMessage = 'Límite excedido';
    else if (error.status === 503) errorMessage = 'Servicio no disponible';

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '2mb',
  },
};