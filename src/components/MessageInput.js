import { useState, useRef, useEffect } from 'react';
import styles from '../styles/MessageInput.module.css';

const MessageInput = ({ onSendMessage, onStopResponse, isResponding = false }) => {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    if (trimmedMessage && !isResponding) {
      onSendMessage(trimmedMessage);
      setMessage('');
      adjustTextareaHeight();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isResponding && message.trim()) handleSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    // Check if browser supports speech recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsSpeechSupported(true);
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'es-ES';

        recognitionRef.current.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');
          setMessage(transcript);
        };

        recognitionRef.current.onend = () => {
          if (isListening) {
            recognitionRef.current.start();
          }
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  const toggleVoiceInput = async () => {
    if (!isListening) {
      try {
        setMessage(''); // Clear previous message
        await recognitionRef.current.start();
        setIsListening(true);
        
        // Configurar un temporizador para detectar pausas largas
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        
        // Reiniciar el temporizador cada vez que se detecte voz
        let silenceTimer;
        const resetSilenceTimer = () => {
          if (silenceTimer) clearTimeout(silenceTimer);
          silenceTimer = setTimeout(() => {
            if (isListening && message.trim()) {
              // Enviar automáticamente después de 1.5 segundos de silencio
              handleSubmit({ preventDefault: () => {} });
              if (recognitionRef.current) {
                recognitionRef.current.stop();
              }
            }
          }, 1500); // 1.5 segundos de silencio
        };
        
        recognitionRef.current.onresult = (event) => {
          // Reiniciar el temporizador cuando se detecta voz
          resetSilenceTimer();
          
          const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');
          setMessage(transcript);
        };
        
        recognitionRef.current.onend = () => {
          if (isListening) {
            recognitionRef.current.start();
          }
          clearTimeout(silenceTimer);
        };
        
        // Iniciar el temporizador
        resetSilenceTimer();
        
      } catch (error) {
        console.error('Error al iniciar el reconocimiento de voz:', error);
        setIsListening(false);
      }
    } else {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error al detener el reconocimiento de voz:', error);
      }
      setIsListening(false);
      
      // Si hay mensaje, enviarlo
      if (message.trim()) {
        handleSubmit({ preventDefault: () => {} });
      }
    }
  };

  return (
    <form className={styles.messageForm} onSubmit={handleSubmit}>
      <div className={styles.inputContainer}>
        <textarea
          ref={textareaRef}
          className={styles.messageInput}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isResponding
              ? 'Lumina está respondiendo...'
              : 'Escribe tu mensaje...'
          }
          rows="1"
          aria-label={
            isResponding ? 'Esperando respuesta...' : 'Escribe tu mensaje'
          }
          disabled={isResponding}
        />

        {/* {isSpeechSupported && (
          <button
            type="button"
            className={`${styles.voiceButton} ${isListening ? styles.listening : ''}`}
            onClick={toggleVoiceInput}
            aria-label={isListening ? 'Detener grabación' : 'Grabar mensaje de voz'}
            disabled={isResponding}
            style={{
              color: isListening ? '#ff4d4f' : 'inherit',
              backgroundColor: isListening ? 'rgba(255, 77, 79, 0.1)' : 'transparent'
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
            {isListening && (
              <span className={styles.pulseRing}></span>
            )}
          </button>
        )} */}
        <button
          type="button"
          className={`${styles.sendButton} ${
            isResponding ? styles.stopButton : ''
          }`}
          onClick={isResponding ? onStopResponse : handleSubmit}
          aria-label={isResponding ? 'Detener respuesta' : 'Enviar mensaje'}
          disabled={!isResponding && !message.trim()}
        >
          {isResponding ? (
            // Icono detener respuesta
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path
                fill="#fff"
                d="M6 16V8q0-.825.588-1.412T8 6h8q.825 0 1.413.588T18 8v8q0 .825-.587 1.413T16 18H8q-.825 0-1.412-.587T6 16"
              />
            </svg>
          ) : (
            // Icono enviar (flecha hacia arriba)
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path
                fill="#fff"
                d="m17.71 11.29l-5-5a1 1 0 0 0-.33-.21a1 1 0 0 0-.76 0a1 1 0 0 0-.33.21l-5 5a1 1 0 0 0 1.42 1.42L11 9.41V17a1 1 0 0 0 2 0V9.41l3.29 3.3a1 1 0 0 0 1.42 0a1 1 0 0 0 0-1.42"
              />
            </svg>
          )}
        </button>
      </div>
    </form>
  );
};

export default MessageInput;
