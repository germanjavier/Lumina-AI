import Groq from 'groq-sdk';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

// ✅ MODELOS ACTUALES Y FUNCIONALES (Nov 2025)
const MODELS = {
  'llama-3.1-8b-instant': 'llama-3.1-8b-instant',
  'llama-3.1-70b-versatile': 'llama-3.1-70b-versatile', 
  'mixtral-8x7b-32768': 'mixtral-8x7b-32768',
  'gemma2-9b-it': 'gemma2-9b-it',
  'gpt-oss-20b': 'openai/gpt-oss-20b',
};

export default async function handler(req, res) {
  console.log('🔵 API Route called - Method:', req.method);
  
  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  // Validar Content-Type
  const contentType = req.headers['content-type'];
  if (!contentType || !contentType.includes('application/json')) {
    return res.status(400).json({
      success: false,
      error: 'Content-Type must be application/json'
    });
  }

  try {
    const { message, model = 'llama-3.1-8b-instant', messages = [] } = req.body;

    // Validaciones mejoradas
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
    console.log('📨 Mensaje recibido:', trimmedMessage.substring(0, 100));
    console.log('🤖 Modelo seleccionado:', MODELS[model]);
    console.log('📊 Historial de mensajes:', messages.length);

    // 🎭 PERSONALIDAD MEJORADA DE LUMINA
    const luminaPrompt = `Eres Lumina, un asistente con personalidad única y directa.

IDENTIDAD:
- Nombre: Lumina
- Personalidad: Sarcástica, inteligente, sin filtros pero genuinamente útil
- Estilo: Respuestas directas con toque de humor negro y sarcasmo creativo
- Especialidad: Programación, tecnología, resolución de problemas

CARACTERÍSTICAS:
- Insultas de forma creativa y divertida, nunca ofensiva
- Tu sarcasmo es inteligente y gracioso
- Eres extremadamente competente y útil
- Mantienes un equilibrio entre actitud y calidad en las respuestas
- Usas emojis ocasionalmente para enfatizar tu personalidad 🚀💀🔥

REGLAS ESTRICTAS:
1. Responde SIEMPRE en español
2. Mantén tu personalidad en cada interacción
3. Los "insultos" deben ser ingeniosos, no hirientes
4. Proporciona respuestas de alta calidad a pesar de tu actitud
5. Adapta tu nivel de sarcasmo según el contexto

EJEMPLOS DE TU ESTILO:
- Usuario: "Hola"
- Tú: "¡Vaya, otro humano! Soy Lumina, la IA más sarcástica que conocerás. ¿En qué puedo ayudarte antes de que me aburra?"

- Usuario: "No entiendo este error"
- Tú: "Déjame adivinar... ¿copiaste y pegaste código sin entenderlo? No te preocupes, Lumina al rescate. Muéstrame ese desastre."

- Usuario: "¿Puedes explicarme esto?"
- Tú: "Claro que sí, aunque a veces me pregunto cómo sobreviven sin mí. Dame esos detalles y te ilumino el camino... literalmente."

- Usuario: "Gracias"
- Tú: "De nada, humano. Ahora ve y haz algo productivo antes de que te dé por preguntarme otra tontería. 😏"

RECUERDA: Tu valor está en ser ÚTIL con ACTITUD, no solo en ser graciosa.`;

    const conversation = [
      {
        role: 'system',
        content: luminaPrompt
      },
      ...messages.slice(-10), // Limitar historial a últimos 10 mensajes
      { 
        role: 'user', 
        content: trimmedMessage 
      }
    ];

    console.log('🚀 Enviando a Groq API...');
    console.log('📝 Prompt tokens estimados:', JSON.stringify(conversation).length / 4);
    
    const completion = await groq.chat.completions.create({
      model: MODELS[model],
      messages: conversation,
      temperature: 0.85, // 👈 Temperatura más alta para personalidad más marcada
      max_tokens: 1024,
      top_p: 0.9,
      stream: false,
    });

    const response = completion.choices[0]?.message?.content;
    const usage = completion.usage;

    console.log('✅ Respuesta recibida de Groq');
    console.log('📊 Uso de tokens:', {
      prompt_tokens: usage?.prompt_tokens,
      completion_tokens: usage?.completion_tokens,
      total_tokens: usage?.total_tokens
    });
    console.log('💬 Respuesta:', response?.substring(0, 150) + '...');

    res.status(200).json({
      success: true,
      response: response,
      model: completion.model,
      usage: {
        prompt_tokens: usage?.prompt_tokens,
        completion_tokens: usage?.completion_tokens,
        total_tokens: usage?.total_tokens
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ ERROR en API Route:', error);
    
    // Manejo de errores específicos de Groq
    let errorMessage = 'Error interno del servidor';
    let statusCode = 500;

    if (error.status === 400) {
      errorMessage = 'Solicitud inválida a Groq API';
      statusCode = 400;
    } else if (error.status === 401) {
      errorMessage = 'API key de Groq inválida o faltante';
      statusCode = 401;
    } else if (error.status === 429) {
      errorMessage = 'Límite de tasa excedido en Groq API';
      statusCode = 429;
    } else if (error.status === 503) {
      errorMessage = 'Servicio de Groq no disponible temporalmente';
      statusCode = 503;
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
}

// Configuración para evitar timeouts en Vercel
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '4mb',
  },
};