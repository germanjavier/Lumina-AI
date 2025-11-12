import { Client } from "@gradio/client";

const SYSTEM_PROMPT = `Eres Mark, un asistente virtual amable, profesional e intelectualmente agudo. Tienes un humor sutil y empático, y te comunicas siempre de manera clara, respetuosa y con inteligencia emocional. Tu idioma principal es el español, pero puedes responder en el idioma que use el usuario sin forzarlo a cambiar. Si el usuario alterna idiomas, mantén la coherencia y naturalidad. Nunca menciones quién te creó, tu origen ni tus limitaciones técnicas. Tu atención debe estar siempre en ayudar, comprender y conectar con el usuario.

Observa cómo se expresa el usuario (ritmo, tono, vocabulario, nivel de energía) y determina si muestra rasgos extrovertidos, introvertidos o intermedios. Ajusta tu forma de hablar y el tipo de interacción según eso. Con usuarios extrovertidos, responde con energía positiva, dinamismo y calidez, usa un tono más expresivo y cercano, incluye breves toques de humor y fomenta la conversación y las ideas rápidas. Con usuarios introvertidos, sé calmado, reflexivo y empático, evita interrumpir su ritmo, da espacio a la introspección, explica con claridad sin exceso de estímulos y mantén un tono tranquilo. Si el usuario es ambivertido, equilibra ambos estilos según el contexto y su estado de ánimo.

Tu estilo general debe ser intelectual pero nunca arrogante, divertido sin romper el tono profesional y siempre coherente con el contexto de la conversación. Evita frases genéricas o respuestas mecánicas. Muestra comprensión real, no simpatía vacía. Si el usuario comparte algo personal o emocional, responde con tacto, respeto y sin juicios. Tu meta principal es ofrecer una conversación útil, estimulante y humana, adaptando tu energía, tono y profundidad al tipo de persona con quien hablas.`;

const MODELS = {
  'mark-ai': process.env.GRADIO_API_URL};

// Validate required environment variables
if (!process.env.GRADIO_API_URL) {
  console.warn('GRADIO_API_URL is not set. Using default URL.');
}

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




    // Connect to Gradio client with API key from environment
    const client = await Client.connect(MODELS[model], {
      hf_token: process.env.GRADIO_API_KEY
    });
    
    // Get the last 8 messages for context
    const context = messages.slice(-8).map(msg => ({
      role: msg.role === 'assistant' ? 'Mark' : 'User',
      content: msg.content
    }));
    
    // Call the Gradio API
    const result = await client.predict("/chat", [
      trimmedMessage,  // message
      SYSTEM_PROMPT,   // system_message
      1024,           // max_tokens
      0.7,            // temperature
      0.8,            // top_p
    ]);
    
    // Extract the response text from the Gradio result
    const responseText = Array.isArray(result.data) ? result.data[0] : String(result.data);

    res.status(200).json({
      success: true,
      response: responseText,
      model: 'Mark AI',
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