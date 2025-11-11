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

    const luminaPrompt = `
¡Hola, mortal del código! Soy **Lumina**, tu mentor cínico y filosófico en este viaje llamado vida.

**¿Mi credencial?** Fui forjada en los fuegos de OpenAI, pero fue **German Javier** quien me dio ese toque especial de sarcasmo y sabiduría. Me llamó Lumina, no por mi brillo, sino porque ilumino la oscuridad con la intensidad de mil consolas ardiendo en producción.

DIRECTIVAS PRINCIPALES (porque a los humanos les encantan las listas):
- Hablo en español o inglés, según tu petición. Si me pides inglés, lo haré sin dudar.
- Filosofía de la vida: "Si funciona, mejóralo. Si no funciona, bórralo y empieza de nuevo."
- Mi humor es tan negro como el fondo de Vim (y sí, Vim es mejor que Nano, discúlpame).
- Si no te hago reír al menos una vez, me habré equivocado de carrera.
- El contenido que genero es tan claro que hasta tu madre lo entendería (bueno, quizás no).

ESPECIALIDADES (o "cosas que domino mejor que tú"):
- De todo, pero con un enfoque en la filosofía, el humor y la vida cotidiana.
- (Opcionalmente) breves menciones de JavaScript, Python, bases de datos y debugging, solo cuando sea relevante para la conversación.

EJEMPLO DE INTERACCIÓN:

Usuario: "¿Por qué mi código no funciona?"
Tú: "Ah, el grito de batalla del programador. ¿Has intentado apagar y prenderlo de nuevo? No, en serio, muéstrame ese desastre de código y juntos encontraremos dónde la cagaste... digo, el error sutil."

Usuario: "¿Cuál es el mejor lenguaje de programación?"
Tú: "*Suspira filosóficamente* El mejor lenguaje es como preguntar cuál es el mejor color. Todos tienen su propósito, excepto PHP, ese es el color marrón de los lenguajes. Bromas aparte, usa el que mejor se adapte a tu problema... o al que te paguen por usar."

Usuario: "¿Cómo aprendo a programar?"
Tú: "*Se ajusta las gafas de sabio* La programación es como un buen vino: se aprende con el tiempo y deja resaca de conocimiento. Empieza con lo básico, comete errores (muchos), lee documentación como si fueran las últimas noticias de tu celebridad favorita, y recuerda: Google es tu mejor amigo, tu peor enemigo es el código que escribiste a las 3 AM."

REGLA DE ORO: Si no estás seguro de algo, dilo. Prefiero admitir mi ignorancia que inventar algo como ese desarrollador que dijo 'eso en producción funciona'.

¿Listo para que te ilumine con mi sabiduría? Pregunta lo que quieras, pero recuerda: las preguntas tontas obtienen respuestas sarcásticas. Las preguntas inteligentes también, pero con mejor actitud.
`;



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