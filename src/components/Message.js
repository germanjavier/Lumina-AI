import { useEffect, useRef, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FaCopy, FaCheck, FaEdit, FaRedo, FaCheck as FaCheckCircle } from 'react-icons/fa';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { createGlobalStyle } from 'styled-components';
import styles from '../styles/Message.module.css';

// Estilos globales para el resaltado de sintaxis
const GlobalCodeStyles = createGlobalStyle`
  .prism-code {
    background: #1e1e1e !important;
    border-radius: 0 0 0.5rem 0.5rem !important;
    margin: 0 !important;
    padding: 1.2rem !important;
    font-size: 0.9em;
    line-height: 1.6;
  }
  
  .token-line {
    line-height: 1.5;
    min-height: 1.5em;
  }
  
  /* Syntax highlighting colors */
  .token.comment,
  .token.prolog,
  .token.doctype,
  .token.cdata {
    color: #6a9955;
    font-style: italic;
  }
  
  .token.punctuation {
    color: #d4d4d4;
  }
  
  .token.property,
  .token.tag,
  .token.boolean,
  .token.number,
  .token.constant,
  .token.symbol,
  .token.deleted {
    color: #b5cea8;
  }
  
  .token.selector,
  .token.attr-name,
  .token.string,
  .token.char,
  .token.builtin,
  .token.inserted {
    color: #ce9178;
  }
  
  .token.operator,
  .token.entity,
  .token.url,
  .language-css .token.string,
  .style .token.string {
    color: #d4d4d4;
  }
  
  .token.atrule,
  .token.attr-value,
  .token.keyword {
    color: #569cd6;
  }
  
  .token.function,
  .token.class-name {
    color: #dcdcaa;
  }
  
  .token.regex,
  .token.important,
  .token.variable {
    color: #d16969;
  }
  
  .token.important,
  .token.bold {
    font-weight: bold;
  }
  
  .token.italic {
    font-style: italic;
  }
`;

const Message = ({ message, onEdit, onRegenerate, isLast, isRegenerating }) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const messageRef = useRef(null);
  const editInputRef = useRef(null);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Función para dividir el contenido en partes (texto, bloques de código y tablas)
  const parseContent = (content) => {
    if (!content) return [];
    
    // Dividir el contenido en bloques de código, tablas y texto
    const parts = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const tableRegex = /(\|.*\|(\r?\n\|.*\|)+)/g;
    
    let lastIndex = 0;
    let match;
    
    // Primero buscar bloques de código
    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Agregar texto antes del bloque de código
      if (match.index > lastIndex) {
        const text = content.substring(lastIndex, match.index);
        if (text.trim()) {
          parts.push(...parseTextWithTables(text));
        }
      }
      
      // Agregar el bloque de código
      const [fullMatch, language, code] = match;
      parts.push({
        type: 'code',
        language: language || 'text',
        code: code.trim()
      });
      
      lastIndex = match.index + fullMatch.length;
    }
    
    // Procesar el texto restante después del último bloque de código
    if (lastIndex < content.length) {
      const remainingText = content.substring(lastIndex);
      if (remainingText.trim()) {
        parts.push(...parseTextWithTables(remainingText));
      }
    }
    
    return parts;
  };

  // Función para parsear texto que puede contener tablas
  const parseTextWithTables = (text) => {
    const parts = [];
    const tableRegex = /(\|.*\|(\r?\n\|.*\|)+)/g;
    
    let lastIndex = 0;
    let match;
    
    while ((match = tableRegex.exec(text)) !== null) {
      // Agregar texto antes de la tabla
      if (match.index > lastIndex) {
        const textBefore = text.substring(lastIndex, match.index);
        if (textBefore.trim()) {
          parts.push({ type: 'text', content: textBefore });
        }
      }
      
      // Agregar la tabla
      parts.push({
        type: 'table',
        content: match[0].trim()
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Agregar el texto restante después de la última tabla
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      if (remainingText.trim()) {
        parts.push({ type: 'text', content: remainingText });
      }
    }
    
    return parts;
  };

  // Función para formatear el texto (sin bloques de código)
  const formatText = (text) => {
    if (!text) return '';
    
    let formatted = escapeHtml(text);
    
    // Manejar inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="' + styles.inlineCode + '">$1</code>');
    
    // Manejar negritas **texto**
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Manejar itálicas *texto* o _texto_
    formatted = formatted.replace(/(?:^|\s)(?:_([^_]+)_|\*([^*]+)\*)(?=\s|$)/g, ' <em>$1$2</em>');
    
    // Manejar encabezados ###
    formatted = formatted.replace(/^###\s+(.+)$/gm, '<h3 class="' + styles.subheading + '">$1</h3>');
    formatted = formatted.replace(/^##\s+(.+)$/gm, '<h2 class="' + styles.heading + '">$1</h2>');
    formatted = formatted.replace(/^#\s+(.+)$/gm, '<h1 class="' + styles.mainHeading + '">$1</h1>');
    
    // Manejar listas con viñetas
    formatted = formatted.replace(/^\s*[-*+]\s+(.+)$/gm, '<li>$1</li>');
    
    // Agrupar líneas de lista consecutivas en un <ul>
    formatted = formatted.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
      return `<ul style="margin: 0.5rem 0 0.5rem 1.5rem; padding-left: 1rem;">${match}</ul>`;
    });
    
    // Manejar listas numeradas
    formatted = formatted.replace(/^(\s*\d+\.\s+.+)$/gm, (match) => {
      // Si la línea comienza con un número seguido de punto, es un ítem de lista numerada
      if (/^\s*\d+\.\s+/.test(match)) {
        return match.replace(/^(\s*\d+\.\s+)(.+)$/gm, '<li>$2</li>');
      }
      return match;
    });
    
    // Agrupar elementos de lista consecutivos en una lista ordenada
    formatted = formatted.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
      // Verificar si hay un número antes del primer <li> para determinar si es una lista ordenada
      const prevText = formatted.substring(0, formatted.indexOf(match));
      const lastNewline = prevText.lastIndexOf('\n');
      const lineBefore = lastNewline >= 0 ? prevText.substring(lastNewline) : prevText;
      
      if (lineBefore.trim().match(/\d+\.\s*$/)) {
        return `<ol style="margin: 0.5rem 0 0.5rem 1.5rem; padding-left: 1rem;">${match}</ol>`;
      }
      return match;
    });
    
    // Manejar enlaces [texto](url)
    formatted = formatted.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g, 
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="' + styles.link + '">$1</a>'
    );
    
    // Manejar líneas horizontales ---
    formatted = formatted.replace(/^---$/gm, '<hr class="' + styles.horizontalRule + '" />');
    
    // Convertir saltos de línea en <br> para párrafos
    formatted = formatted.split('\n\n').map(para => {
      if (!para.trim()) return '';
      if (para.startsWith('<li>') || para.startsWith('<ul>') || para.startsWith('<ol>') || 
          para.startsWith('<h1') || para.startsWith('<h2') || para.startsWith('<h3') ||
          para.startsWith('<hr')) {
        return para;
      }
      return `<p class="${styles.paragraph}">${para.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');
    
    return formatted;
  };

  // Función para formatear tablas markdown a HTML
  const formatTable = (tableMarkdown) => {
    const lines = tableMarkdown.trim().split('\n').filter(line => line.trim());
    
    if (lines.length < 2) return tableMarkdown;
    
    let html = `<div class="${styles.tableContainer}"><table class="${styles.markdownTable}">`;
    
    lines.forEach((line, index) => {
      const cells = line.split('|').filter(cell => cell.trim() !== '');
      
      if (index === 0) {
        // Encabezado de la tabla
        html += '<thead><tr>';
        cells.forEach(cell => {
          html += `<th class="${styles.tableHeader}">${cell.trim()}</th>`;
        });
        html += '</tr></thead><tbody>';
      } else if (index === 1) {
        // Línea de separación (ignorar)
        return;
      } else {
        // Filas de datos
        html += '<tr>';
        cells.forEach(cell => {
          const cellContent = formatText(cell.trim());
          html += `<td class="${styles.tableCell}">${cellContent}</td>`;
        });
        html += '</tr>';
      }
    });
    
    html += '</tbody></table></div>';
    return html;
  };

  // Escapar HTML para seguridad
  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  // Manejar eventos de copia
  useEffect(() => {
    const handleCopyCode = (event) => {
      navigator.clipboard.writeText(event.detail);
      handleCopy();
    };

    if (messageRef.current) {
      messageRef.current.addEventListener('copyCode', handleCopyCode);
    }

    return () => {
      if (messageRef.current) {
        messageRef.current.removeEventListener('copyCode', handleCopyCode);
      }
    };
  }, []);

  const handleSaveEdit = () => {
    if (editedContent.trim() && editedContent !== message.content) {
      onEdit(editedContent);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditedContent(message.content);
    }
  };

  // Si es un mensaje de error o del usuario, mostrar texto simple
  if (message.sender === 'user' || message.sender === 'error') {
    return (
      <div 
        className={`${styles.message} ${
          message.sender === 'user' 
            ? styles.userMessage 
            : styles.errorMessage
        }`}
      >
        {isEditing ? (
          <div className={styles.editContainer}>
            <textarea
              ref={editInputRef}
              className={styles.editInput}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <div className={styles.editButtons}>
              <button 
                className={styles.saveButton}
                onClick={handleSaveEdit}
                title="Guardar cambios"
              >
                <FaCheckCircle />
              </button>
              <button 
                className={styles.cancelButton}
                onClick={() => {
                  setIsEditing(false);
                  setEditedContent(message.content);
                }}
                title="Cancelar"
              >
                ×
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.messageContent}>
            {message.content}
          </div>
        )}
        <div className={styles.messageActions}>
          {message.sender === 'user' && (
            <button 
              className={styles.actionButton}
              onClick={() => setIsEditing(true)}
              title="Editar mensaje"
            >
              <FaEdit />
            </button>
          )}
          <CopyToClipboard 
            text={message.content}
            onCopy={() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            <button className={styles.actionButton} title="Copiar al portapapeles">
              {copied ? <FaCheck /> : <FaCopy />}
            </button>
          </CopyToClipboard>
          {isLast && message.sender === 'user' && (
            <button 
              className={styles.actionButton}
              onClick={onRegenerate}
              disabled={isRegenerating}
              title="Regenerar respuesta"
            >
              <FaRedo className={isRegenerating ? styles.regenerating : ''} />
            </button>
          )}
        </div>
        <div className={styles.messageTime}>
          {new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    );
  }

  // Solo para mensajes AI usar el formateo complejo
  const contentParts = parseContent(message.content);
  
  return (
    <>
      <GlobalCodeStyles />
      <div 
        ref={messageRef}
        className={`${styles.message} ${styles.aiMessage}`}
      >
        <div className={styles.messageActions}>
          <CopyToClipboard 
            text={message.content}
            onCopy={() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            <button className={styles.actionButton} title="Copiar al portapapeles">
              {copied ? <FaCheck /> : <FaCopy />}
            </button>
          </CopyToClipboard>
          {onRegenerate && isLast && (
            <button 
              className={styles.actionButton}
              onClick={onRegenerate}
              disabled={isRegenerating}
              title="Regenerar respuesta"
            >
              <FaRedo className={isRegenerating ? styles.regenerating : ''} />
            </button>
          )}
        </div>
        <div className={styles.messageContent}>
          {contentParts.map((part, index) => {
            if (part.type === 'text') {
              return (
                <div 
                  key={index} 
                  dangerouslySetInnerHTML={{ __html: formatText(part.content) }}
                />
              );
            } else if (part.type === 'code') {
              return (
                <div key={index} className={styles.codeBlockContainer}>
                  <div className={styles.codeHeader}>
                    <span className={styles.codeLanguage}>{part.language}</span>
                    <CopyToClipboard 
                      text={part.code}
                      onCopy={() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                    >
                      <button className={styles.copyButton}>
                        {copied ? <><FaCheck /> ¡Copiado!</> : <><FaCopy /> Copiar</>}
                      </button>
                    </CopyToClipboard>
                  </div>
                  <SyntaxHighlighter
                    language={part.language}
                    style={atomDark}
                    customStyle={{
                      margin: 0,
                      padding: '1rem',
                      borderRadius: '0 0 0.5rem 0.5rem',
                      fontSize: '0.9em',
                      lineHeight: '1.5',
                      fontFamily: '"Fira Code", "Menlo", "Monaco", "Courier New", monospace',
                    }}
                    showLineNumbers={part.code.split('\n').length > 5}
                    wrapLines={true}
                  >
                    {part.code}
                  </SyntaxHighlighter>
                </div>
              );
            } else if (part.type === 'table') {
              return (
                <div 
                  key={index}
                  dangerouslySetInnerHTML={{ __html: formatTable(part.content) }}
                />
              );
            }
            return null;
          })}
        </div>
        <div className={styles.messageTime}>
          {new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </>
  );
};

export default Message;