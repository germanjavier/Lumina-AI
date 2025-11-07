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
  const messagesEndRef = useRef(null);

  const models = [
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Rápido)' },
    { id: 'gpt-oss-20b', name: 'GPT OSS 20B' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessageToAI = async (messageContent, messageHistory) => {
    setIsTyping(true);

    try {
      console.log('🟡 Haciendo fetch a /api/chat...');
      
      const response = await fetch('/api/chat', {
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
    }
  };

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;

    console.log('🟡 Enviando mensaje:', message);

    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      content: message,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const aiResponse = await sendMessageToAI(message, [...messages, userMessage]);
      
      // Add AI response to chat
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          content: aiResponse,
          sender: 'ai',
          timestamp: new Date().toISOString()
        }
      ]);
      
      console.log('✅ Mensaje procesado exitosamente');
      
    } catch (error) {
      console.error('❌ Error en handleSendMessage:', error);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          content: `Error: ${error.message}`,
          sender: 'error',
          timestamp: new Date().toISOString()
        }
      ]);
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
      
      // Add the new AI response
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          content: aiResponse,
          sender: 'ai',
          timestamp: new Date().toISOString()
        }
      ]);
      
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
      {/* <div className={styles.chatHeader}>
        <div className={styles.headerContent}>
          <h1>Lumina</h1>
          <p>Powered by Groq</p>
        </div>
        <ModelSelector 
          models={models}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
      </div> */}

      {/* <div className={styles.modelInfo}>
        <ModelSelector 
          models={models}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
      </div> */}

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
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
}