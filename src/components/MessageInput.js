import { useState, useRef, useEffect } from 'react';
import styles from '../styles/MessageInput.module.css';

const MessageInput = ({ onSendMessage, onStopResponse, isResponding = false }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isResponding) {
      onSendMessage(message.trim());
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
    adjustTextareaHeight();
  }, [message]);

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

        <button
          type="button"
          className={`${styles.sendButton} ${
            isResponding ? styles.stopButton : ''
          }`}
          onClick={isResponding ? onStopResponse : handleSubmit}
          aria-label={isResponding ? 'Detener respuesta' : 'Enviar mensaje'}
          disabled={!isResponding && !message.trim()} // Solo se desactiva si no hay texto y no está respondiendo
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
