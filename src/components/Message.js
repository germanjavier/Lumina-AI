import { useEffect, useRef, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FaCopy, FaCheck, FaEdit, FaRedo, FaCheck as FaCheckCircle, FaCode, FaTable, FaTag, FaList, FaJs, FaPython, FaJava, FaHtml5, FaCss3Alt, FaReact, FaNodeJs } from 'react-icons/fa';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { createGlobalStyle } from 'styled-components';
import styles from '../styles/Message.module.css';

// Estilos globales mejorados
const GlobalCodeStyles = createGlobalStyle`
  .prism-code {
    background: #000 !important;
    border-radius: 0 0 0.5rem 0.5rem !important;
    margin: 0 !important;
    padding: 0.5rem 0 !important;
    font-size: 0.9em;
    line-height: 1.5;
    width: 100%;
    box-sizing: border-box;
  }
  
  .codeBlockContainer {
    margin: 1rem 0;
    border-radius: 0.5rem;
    overflow: hidden;
    background: #000;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
  
  .languageIcon {
    font-size: 1rem;
  }
  
  /* Colorful language icons */
  .languageIcon[data-icon="faJs"] { color: #f0db4f; }
  .languageIcon[data-icon="faPython"] { color: #3776ab; }
  .languageIcon[data-icon="faJava"] { color: #007396; }
  .languageIcon[data-icon="faHtml5"] { color: #e34c26; }
  .languageIcon[data-icon="faCss3Alt"] { color: #264de4; }
  .languageIcon[data-icon="faReact"] { color: #61dbfb; }
  .languageIcon[data-icon="faNodeJs"] { color: #68a063; }
  
  /* Adjust line number padding */
  .prism-code .token-line {
    padding: 0 0.5rem;
  }
  
  /* Line number styling */
  .prism-code .token.line-number {
    color: #6e7681;
    display: inline-block;
    width: 1.5em;
    user-select: none;
    opacity: 0.7;
    padding-right: 1px;
    margin-right: 1px;
    border-right: 1px solid #333 !important;
    text-align: left;
  }
  
  .token-line {
    line-height: 1.5;
    min-height: 1.5em;
  }
  
  .prism-code .token-line {
    padding: 0 1rem !important;
    margin: 0 !important;
  }
  
  /* Remove extra padding from the first and last lines */
  .prism-code > div:first-child .token-line {
    padding-top: 0 !important;
  }
  
  .prism-code > div:last-child .token-line {
    padding-bottom: 0 !important;
  }
  
  .codeHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #000;
    padding: 0.5rem 1rem;
    border-top-left-radius: 0.5rem;
    border-top-right-radius: 0.5rem;
    font-family: 'Fira Code', 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: 0.8rem;
    color: #fff;
    border-bottom: 1px solid #333;
  }
  
  .codeLanguage {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    color: #9ca3af;
  }
  
  .copyButton {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #9ca3af;
    cursor: pointer;
    padding: 0.15rem 0.5rem;
    border-radius: 0.25rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    transition: none;
  }
  
  .copyButton:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  /* Mejoras en syntax highlighting */
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
`;

const Message = ({ message, onEdit, onRegenerate, isLast, isRegenerating, isStreaming = false }) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const messageRef = useRef(null);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Función mejorada para parsear contenido con más elementos
  const parseContent = (content) => {
    if (!content) return [];
    
    const parts = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const tableRegex = /(\|.*\|(\r?\n\|.*\|)+)/g;
    const tagRegex = /(?:^|\s)(#[a-zA-Z0-9_]+)/g;
    
    let lastIndex = 0;
    let match;
    
    // Buscar bloques de código
    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        const text = content.substring(lastIndex, match.index);
        if (text.trim()) {
          parts.push(...parseTextWithTablesAndTags(text));
        }
      }
      
      const [fullMatch, language, code] = match;
      parts.push({
        type: 'code',
        language: language || 'text',
        code: code.trim(),
        icon: <FaCode />
      });
      
      lastIndex = match.index + fullMatch.length;
    }
    
    // Procesar texto restante
    if (lastIndex < content.length) {
      const remainingText = content.substring(lastIndex);
      if (remainingText.trim()) {
        parts.push(...parseTextWithTablesAndTags(remainingText));
      }
    }
    
    return parts;
  };

  // Función mejorada para parsear texto con tablas y tags
  const parseTextWithTablesAndTags = (text) => {
    const parts = [];
    const tableRegex = /(\|.*\|(\r?\n\|.*\|)+)/g;
    const tagRegex = /(?:^|\s)(#[a-zA-Z0-9_]+)/g;
    
    let lastIndex = 0;
    let match;
    
    // Buscar tablas
    while ((match = tableRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const textBefore = text.substring(lastIndex, match.index);
        if (textBefore.trim()) {
          parts.push({ type: 'text', content: textBefore });
        }
      }
      
      parts.push({
        type: 'table',
        content: match[0].trim(),
        icon: <FaTable />
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Procesar texto restante
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      if (remainingText.trim()) {
        // Buscar tags en el texto restante
        const tagMatches = [...remainingText.matchAll(tagRegex)];
        if (tagMatches.length > 0) {
          let textLastIndex = 0;
          tagMatches.forEach((tagMatch, index) => {
            if (tagMatch.index > textLastIndex) {
              const textBeforeTag = remainingText.substring(textLastIndex, tagMatch.index);
              if (textBeforeTag.trim()) {
                parts.push({ type: 'text', content: textBeforeTag });
              }
            }
            
            parts.push({
              type: 'tag',
              content: tagMatch[1],
              icon: <FaTag />
            });
            
            textLastIndex = tagMatch.index + tagMatch[0].length;
          });
          
          if (textLastIndex < remainingText.length) {
            const finalText = remainingText.substring(textLastIndex);
            if (finalText.trim()) {
              parts.push({ type: 'text', content: finalText });
            }
          }
        } else {
          parts.push({ type: 'text', content: remainingText });
        }
      }
    }
    
    return parts;
  };

  // Función de formateo mejorada
  const formatText = (text) => {
    if (!text) return '';
    
    let formatted = escapeHtml(text);
    
    // Mejorar inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="' + styles.inlineCode + '">$1</code>');
    
    // Negritas mejoradas
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong class="' + styles.boldText + '">$1</strong>');
    
    // Itálicas mejoradas
    formatted = formatted.replace(/(?:^|\s)(?:_([^_]+)_|\*([^*]+)\*)(?=\s|$)/g, ' <em class="' + styles.italicText + '">$1$2</em>');
    
    // Encabezados mejorados
    formatted = formatted.replace(/^####\s+(.+)$/gm, '<h4 class="' + styles.subsubheading + '">$1</h4>');
    formatted = formatted.replace(/^###\s+(.+)$/gm, '<h3 class="' + styles.subheading + '">$1</h3>');
    formatted = formatted.replace(/^##\s+(.+)$/gm, '<h2 class="' + styles.heading + '">$1</h2>');
    formatted = formatted.replace(/^#\s+(.+)$/gm, '<h1 class="' + styles.mainHeading + '">$1</h1>');
    
    // Citas en bloque
    formatted = formatted.replace(/^>\s+(.+)$/gm, '<blockquote class="' + styles.blockquote + '">$1</blockquote>');
    
    // Listas mejoradas
    formatted = formatted.replace(/^\s*[-*+]\s+(.+)$/gm, '<li class="' + styles.listItem + '">$1</li>');
    formatted = formatted.replace(/^\s*\d+\.\s+(.+)$/gm, '<li class="' + styles.listItem + '">$1</li>');
    
    // Agrupar listas
    formatted = formatted.replace(/(<li class="[^"]*">.*<\/li>\n?)+/g, (match) => {
      const isOrdered = /^\s*\d+\./.test(text.substring(0, text.indexOf(match)));
      return isOrdered ? 
        `<ol class="${styles.orderedList}">${match}</ol>` : 
        `<ul class="${styles.unorderedList}">${match}</ul>`;
    });
    
    // Enlaces mejorados
    formatted = formatted.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g, 
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="' + styles.link + '">$1</a>'
    );
    
    // Líneas horizontales mejoradas
    formatted = formatted.replace(/^---$/gm, '<hr class="' + styles.horizontalRule + '" />');
    
    // Tags mejorados
    formatted = formatted.replace(
      /(?:^|\s)(#[a-zA-Z0-9_]+)/g, 
      ' <span class="' + styles.tag + '">$1</span>'
    );
    
    // Párrafos mejorados
    formatted = formatted.split('\n\n').map(para => {
      if (!para.trim()) return '';
      if (para.startsWith('<') && (para.includes('<li>') || para.includes('<ul>') || para.includes('<ol>') || 
          para.includes('<h1') || para.includes('<h2') || para.includes('<h3') || para.includes('<h4') ||
          para.includes('<blockquote') || para.includes('<hr'))) {
        return para;
      }
      return `<p class="${styles.paragraph}">${para.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');
    
    return formatted;
  };

  // Función mejorada para formatear tablas
  const formatTable = (tableMarkdown) => {
    const lines = tableMarkdown.trim().split('\n').filter(line => line.trim());
    
    if (lines.length < 2) return tableMarkdown;
    
    let html = `<div class="${styles.tableContainer}">
                  <div class="${styles.tableHeader}">
                    <FaTable class="${styles.tableIcon}" />
                    <span>Tabla de datos</span>
                  </div>
                  <table class="${styles.markdownTable}">`;
    
    lines.forEach((line, index) => {
      const cells = line.split('|').filter(cell => cell.trim() !== '');
      
      if (index === 0) {
        html += '<thead><tr>';
        cells.forEach(cell => {
          html += `<th class="${styles.tableHeaderCell}">${cell.trim()}</th>`;
        });
        html += '</tr></thead><tbody>';
      } else if (index === 1) {
        return;
      } else {
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

  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

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

  const isTyping = isStreaming || false;

  const getLanguageIcon = (language) => {
    const lang = language?.toLowerCase() || 'code';
    const iconProps = { className: styles.languageIcon, 'data-icon': '' };
    
    switch(lang) {
      case 'javascript':
      case 'js':
        iconProps['data-icon'] = 'faJs';
        return <FaJs {...iconProps} />;
      case 'python':
      case 'py':
        iconProps['data-icon'] = 'faPython';
        return <FaPython {...iconProps} />;
      case 'java':
        iconProps['data-icon'] = 'faJava';
        return <FaJava {...iconProps} />;
      case 'html':
        iconProps['data-icon'] = 'faHtml5';
        return <FaHtml5 {...iconProps} />;
      case 'css':
        iconProps['data-icon'] = 'faCss3Alt';
        return <FaCss3Alt {...iconProps} />;
      case 'jsx':
      case 'tsx':
        iconProps['data-icon'] = 'faReact';
        return <FaReact {...iconProps} />;
      case 'json':
        iconProps['data-icon'] = 'faNodeJs';
        return <FaNodeJs {...iconProps} />;
      default:
        iconProps['data-icon'] = 'faCode';
        return <FaCode {...iconProps} />;
    }
  };

  // Mensajes de usuario o error
  if (message.sender === 'user' || message.sender === 'error') {
    return (
      <div 
        className={`${styles.message} ${
          message.sender === 'user' 
            ? styles.userMessage 
            : styles.errorMessage
        }`}
      >
        <span className={styles.senderName}>Tu</span>
        {isEditing ? (
          <div className={styles.editContainer}>
            <textarea
              className={styles.editInput}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              placeholder="Escribe tu mensaje..."
            />
            <div className={styles.editButtons}>
              <button 
                className={styles.saveButton}
                onClick={handleSaveEdit}
                title="Guardar cambios"
              >
                <FaCheckCircle /> Guardar
              </button>
              <button 
                className={styles.cancelButton}
                onClick={() => {
                  setIsEditing(false);
                  setEditedContent(message.content);
                }}
                title="Cancelar"
              >
                × Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.messageContent}>
            <div dangerouslySetInnerHTML={{ __html: formatText(message.content) }} />
            {isStreaming && <span className={styles.typingCursor}>|</span>}
          </div>
        )}
        {/* No action buttons for text messages */}
        <div className={styles.messageTime}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    );
  }

  // Mensajes AI con diseño mejorado
  const contentParts = parseContent(message.content);
  
  // Only show copy button for code blocks, not for regular text
  
  return (
    <>
      <GlobalCodeStyles />
      <div ref={messageRef} className={`${styles.message} ${styles.aiMessage}`}>
        <span className={styles.senderName}>Lumina</span>
        <div className={styles.messageContent}>
          {contentParts.map((part, index) => {
            if (part.type === 'text') {
              return (
                <div 
                  key={index} 
                  className={styles.textPart}
                  dangerouslySetInnerHTML={{ __html: formatText(part.content) }}
                />
              );
            } else if (part.type === 'code') {
              return (
                <div key={index} className={styles.codeBlockContainer}>
                  <div className={styles.codeHeader}>
                    <div className={styles.codeLanguage}>
                      {getLanguageIcon(part.language)}
                      <span>{part.language.toUpperCase()}</span>
                    </div>
                    <CopyToClipboard text={part.code} onCopy={handleCopy}>
                      <button className={styles.copyButton} title="Copiar código">
                        {copied ? <FaCheck /> : <FaCopy />}
                      </button>
                    </CopyToClipboard>
                  </div>
                  <SyntaxHighlighter
                    language={part.language}
                    style={atomDark}
                    customStyle={{
                      margin: 0,
                      padding: '1.5rem',
                      borderRadius: '0 0 0.75rem 0.75rem',
                      fontSize: '0.85em',
                      lineHeight: '1.5',
                    }}
                    showLineNumbers={true}
                    wrapLines={true}
                    lineNumberStyle={{
                      color: '#6a737d',
                      minWidth: '3em'
                    }}
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
            } else if (part.type === 'tag') {
              return (
                <span key={index} className={styles.tag}>
                  {part.icon}
                  {part.content}
                </span>
              );
            }
            return null;
          })}
        </div>

        <div className={styles.messageFooter}>
          <div className={styles.messageTime}>
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </>
  );
};

export default Message;