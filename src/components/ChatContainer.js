import { useState, useRef, useEffect } from 'react';
import Message from './Message';
import MessageInput from './MessageInput';
import ModelSelector from './ModelSelector';
import TypingIndicator from './TypingIndicator';
import styles from '../styles/ChatContainer.module.css';

export default function ChatContainer() {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-oss-20b');
  const [isResponding, setIsResponding] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const synthesisRef = useRef(null);
  const utteranceRef = useRef(null);

  const models = [
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Rápido)' },
    { id: 'gpt-oss-20b', name: 'GPT OSS 20B' }
  ];

  // Inicializar síntesis de voz
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthesisRef.current = window.speechSynthesis;
      
      // Cargar las voces cuando estén disponibles
      const loadVoices = () => {
        const voices = synthesisRef.current.getVoices();
        if (voices.length > 0) {
          console.log('Voces disponibles:', voices);
          // Forzar la carga de voces en algunos navegadores
          window.speechSynthesis.onvoiceschanged = null;
        }
      };
      
      // Algunos navegadores necesitan este evento
      window.speechSynthesis.onvoiceschanged = loadVoices;
      
      // Cargar voces si ya están disponibles
      loadVoices();
      
      // Forzar recarga de voces después de un breve retraso
      const voiceLoadTimer = setTimeout(() => {
        const voices = synthesisRef.current.getVoices();
        console.log('Voces después del retraso:', voices);
      }, 1000);
      
      // Detener la síntesis cuando el componente se desmonte
      return () => {
        clearTimeout(voiceLoadTimer);
        if (synthesisRef.current) {
          synthesisRef.current.cancel();
          window.speechSynthesis.onvoiceschanged = null;
        }
      };
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Función para limpiar el texto de formato markdown y emojis
  const cleanTextForSpeech = (text) => {
    if (!text) return '';
    
    // Eliminar emojis y otros caracteres especiales
    let cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1F0}-\u{1F1FF}]/gu, '');
    
    // Eliminar código entre ```
    cleanText = cleanText.replace(/```[\s\S]*?```/g, '');
    // Eliminar texto entre **
    cleanText = cleanText.replace(/\*\*(.*?)\*\*/g, '$1');
    // Eliminar texto entre *
    cleanText = cleanText.replace(/\*(.*?)\*/g, '$1');
    // Eliminar encabezados
    cleanText = cleanText.replace(/^#+\s+/gm, '');
    // Eliminar enlaces [texto](url)
    cleanText = cleanText.replace(/\[(.*?)\]\(.*?\)/g, '$1');
    // Eliminar líneas vacías múltiples
    cleanText = cleanText.replace(/\n{3,}/g, '\n\n');
    // Eliminar caracteres especiales restantes
    cleanText = cleanText.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1F0}-\u{1F1FF}]/gu, '');
    
    return cleanText.trim();
  };

  // Función para obtener la mejor voz femenina disponible
  const getBestFemaleVoice = () => {
    if (!synthesisRef.current) return null;
    
    const voices = synthesisRef.current.getVoices();
    console.log('Voces disponibles:', voices);
    
    // Intentar encontrar voces femeninas en español
    const femaleVoices = voices.filter(voice => {
      const voiceName = voice.name.toLowerCase();
      const isSpanish = voice.lang.includes('es');
      const isFemale = 
        voiceName.includes('mujer') || 
        voiceName.includes('female') ||
        voiceName.includes('femenina') ||
        voiceName.includes('zira') ||
        voiceName.includes('helena') ||
        voiceName.includes('monica') || // Voz femenina en español
        voiceName.includes('laura') ||  // Otra voz femenina común
        voiceName.includes('paula') ||  // Voz femenina en español
        voiceName.includes('maria') ||  // Voz femenina en español
        voiceName.includes('catalina'); // Voz femenina en macOS
        
      return isSpanish && isFemale;
    });
    
    console.log('Voces femeninas encontradas:', femaleVoices);
    
    // Si no hay voces femeninas, forzar la recarga y buscar de nuevo
    if (femaleVoices.length === 0) {
      console.log('No se encontraron voces femeninas, recargando...');
      const voices = synthesisRef.current.getVoices();
      const defaultFemale = voices.find(v => v.lang.includes('es'));
      console.log('Voz por defecto:', defaultFemale);
      return defaultFemale;
    }
    
    return femaleVoices[0];
  };

  // Función para leer el texto en voz alta
  const speakText = (text) => {
    if (!synthesisRef.current) {
      console.error('SpeechSynthesis no está disponible');
      return;
    }
    
    // Detener cualquier reproducción en curso
    synthesisRef.current.cancel();
    
    const cleanText = cleanTextForSpeech(text);
    if (!cleanText) return;
    
    console.log('Texto a leer:', cleanText);
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-ES';
    
    // Configuración de voz más natural y humana
    utterance.rate = 1.0; // Velocidad normal para sonar más natural
    utterance.pitch = 1.05; // Ligeramente más agudo, pero no demasiado
    utterance.volume = 0.9; // Volumen ligeramente más bajo para sonar más natural
    
    // Añadir pausas naturales
    const sentences = cleanText.split(/(?<=[.!?])\s+/);
    if (sentences.length > 1) {
      // Añadir pausas ligeramente más largas entre oraciones
      utterance.text = sentences.join(' ... ');
    }
    
    // Obtener la mejor voz femenina disponible
    const voice = getBestFemaleVoice();
    if (voice) {
      console.log('Usando voz:', voice.name, voice.lang);
      utterance.voice = voice;
    } else {
      console.warn('No se pudo encontrar una voz femenina');
      // Si no hay voz femenina, cancelar la reproducción
      return;
    }
    
    // Ajustar la velocidad según la longitud del texto
    const words = cleanText.split(/\s+/);
    if (words.length < 10) {
      // Textos muy cortos se leen un poco más despacio
      utterance.rate = 0.9;
    } else if (words.length > 30) {
      // Textos largos se leen un poco más rápido
      utterance.rate = 1.1;
    }
    
    // Añadir variación de tono para sonar más natural
    utterance.pitch = 1.0 + (Math.random() * 0.1 - 0.05); // Pequeña variación aleatoria
    
    utterance.onstart = () => {
      setIsSpeaking(true);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    
    utterance.onerror = (event) => {
      console.error('Error en la síntesis de voz:', event);
      setIsSpeaking(false);
    };
    
    utteranceRef.current = utterance;
    synthesisRef.current.speak(utterance);
  };
  
  // Detener la reproducción de voz
  const stopSpeaking = () => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Función para el efecto de tipeo con streaming
  const typeText = async (text, messageId) => {
    // Iniciar con un pequeño retraso para dar tiempo a que se muestre el mensaje
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Dividir el texto en palabras para un mejor streaming
    const words = text.split(/(\s+)/);
    let currentText = '';
    
    // Función para procesar palabras en lotes
    const processBatch = async (startIndex) => {
      const batchSize = 1; // Procesar una palabra a la vez
      const endIndex = Math.min(startIndex + batchSize, words.length);
      
      for (let i = startIndex; i < endIndex; i++) {
        currentText += words[i];
        
        // Actualizar el estado con el nuevo texto
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, content: currentText }
              : msg
          )
        );
        
        // Hacer scroll al final
        scrollToBottom();
        
        // Pequeña pausa entre palabras para un efecto de tipeo más natural
        await new Promise(resolve => {
          // Pausa más corta para puntuación
          const isPunctuation = /^[.,;:!?]+$/.test(words[i]);
          setTimeout(resolve, isPunctuation ? 150 : 30);
        });
      }
      
      // Procesar el siguiente lote si hay más palabras
      if (endIndex < words.length) {
        // Usar requestAnimationFrame para un mejor rendimiento
        requestAnimationFrame(() => {
          processBatch(endIndex);
        });
      }
    };
    
    // Iniciar el procesamiento
    processBatch(0);
  };

  const stopResponse = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    stopSpeaking();
    setIsResponding(false);
    setIsTyping(false);
    setIsRegenerating(false);
  };
  
  // Limpiar al desmontar el componente
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      stopSpeaking();
    };
  }, []);

  const sendMessageToAI = async (messageContent, messageHistory) => {
    setIsTyping(true);
    setIsResponding(true);
    abortControllerRef.current = new AbortController();

    try {
      console.log('🟡 Haciendo fetch a /api/chat...');
      
      const response = await fetch('/api/chat', {
        signal: abortControllerRef.current?.signal,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageContent,
          model: selectedModel,
          messages: messageHistory.map(({ content, sender }) => ({
            role: sender === 'user' ? 'user' : 'assistant',
            content
          }))
        }),
      });

      console.log('🟡 Response status:', response.status);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Error en la respuesta del servidor');
      }

      return data.response;
      
    } catch (error) {
      console.error('❌ Error en la petición:', error);
      throw error;
    } finally {
      setIsTyping(false);
      setIsRegenerating(false);
      setIsResponding(false);
    }
  };

  const handleSendMessage = async (content) => {
    if (!content.trim() || isResponding) return;

    const userMessage = {
      id: Date.now(),
      content,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Crear mensaje de carga para la IA
    const botMessageId = Date.now() + 1;
    const botMessage = {
      id: botMessageId,
      content: '',
      sender: 'assistant',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, botMessage]);

    try {
      const response = await sendMessageToAI(content, [...messages, userMessage]);
      
      // Usar la función typeText para mostrar el efecto de tipeo
      await typeText(response, botMessageId);
      
      // Leer la respuesta en voz alta
      speakText(response);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      
      // Actualizar el mensaje de error
      setMessages(prev => 
        prev.map(msg => 
          msg.id === botMessageId 
            ? { 
                ...msg, 
                content: 'Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, inténtalo de nuevo.'
              } 
            : msg
        )
      );
    } finally {
      setIsResponding(false);
      setIsTyping(false);
    }
  };

  const handleEditMessage = (newContent, messageId) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: newContent }
          : msg
      )
    );
  };

  const handleRegenerateResponse = async (messageId) => {
    if (isRegenerating) return;
    
    setIsRegenerating(true);
    
    try {
      // Find the index of the message to regenerate
      const messageIndex = messages.findIndex(msg => msg.id === messageId);
      if (messageIndex === -1) return;
      
      // Get all messages up to the one before the AI response
      const messagesUpToUser = messages.slice(0, messageIndex + 1);
      const userMessage = messages[messageIndex];
      
      // Remove any existing AI response that follows
      const updatedMessages = messagesUpToUser.filter(
        (_, idx) => idx <= messageIndex || messages[idx].sender !== 'ai'
      );
      
      setMessages(updatedMessages);
      
      // Get new AI response
      const aiResponse = await sendMessageToAI(
        userMessage.content, 
        updatedMessages.filter(msg => msg.sender !== 'ai')
      );
      
      // Crear mensaje AI vacío para el efecto de tipeo
      const newAiMessage = {
        id: Date.now() + 1,
        content: '',
        sender: 'ai',
        timestamp: new Date().toISOString(),
        isTyping: true
      };
      
      setMessages(prev => [...prev, newAiMessage]);
      
      // Aplicar efecto de tipeo
      await typeText(aiResponse, newAiMessage.id);
      
      // Marcar como completado
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newAiMessage.id 
            ? { ...msg, isTyping: false }
            : msg
        )
      );
      
    } catch (error) {
      console.error('❌ Error al regenerar respuesta:', error);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          content: `Error al regenerar la respuesta: ${error.message}`,
          sender: 'error',
          timestamp: new Date().toISOString()
        }
      ]);
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatMessages}>
        {messages.length === 0 && (
          <div className={styles.welcomeMessage}>
            <h1 style={{ fontWeight: 'bold', textAlign: 'center', color: 'black' }}>¡Hola! Soy Lumina, tu asistente de IA.</h1>
          </div>
        )}
        
        {messages.map((message, index) => (
          <Message 
            key={message.id}
            message={message}
            onEdit={(newContent) => handleEditMessage(newContent, message.id)}
            onRegenerate={() => handleRegenerateResponse(message.id)}
            isLast={index === messages.length - 1}
            isRegenerating={isRegenerating && index === messages.length - 1}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput 
        onSendMessage={handleSendMessage} 
        onStopResponse={stopResponse}
        isResponding={isResponding} 
      />
    </div>
  );
}