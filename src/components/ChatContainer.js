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
  const [selectedModel, setSelectedModel] = useState('mark-ai');
  const [isResponding, setIsResponding] = useState(false);
  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);

  const models = [
    { id: 'mark-ai', name: 'Mark AI' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      
      // Respuesta mostrada, sin lectura automática
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

  // Typing animation for welcome message
  const [welcomeText, setWelcomeText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  
  useEffect(() => {
    if (messages.length > 0) return;
    
    const welcomeMessage = '¡Hola! Soy Mark¡';
    let currentText = '';
    let charIndex = 0;
    
    const typeWriter = () => {
      if (charIndex < welcomeMessage.length) {
        currentText += welcomeMessage.charAt(charIndex);
        setWelcomeText(currentText);
        charIndex++;
        setTimeout(typeWriter, 100);
      } else {
        // Blink cursor effect
        const cursorInterval = setInterval(() => {
          setShowCursor(prev => !prev);
        }, 500);
        
        return () => clearInterval(cursorInterval);
      }
    };
    
    const timer = setTimeout(typeWriter, 1000);
    
    return () => {
      clearTimeout(timer);
      setWelcomeText('');
    };
  }, [messages.length]);

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatMessages}>
        {messages.length === 0 && (
          <div className={styles.welcomeContainer}>
            <div className={styles.welcomeMessage}>
              <h1 style={{ fontWeight: 'bold', color: 'black' }}>
                {welcomeText}
                <span className={`${styles.typingCursor} ${showCursor ? styles.visible : ''}`}>|</span>
              </h1>
            </div>
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