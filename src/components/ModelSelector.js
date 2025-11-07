import { useState, useEffect, useRef } from 'react';
import styles from '../styles/ModelSelector.module.css';

const ModelSelector = ({ models, selectedModel, onModelChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedModelData = models.find(model => model.id === selectedModel) || models[0];

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleModelSelect = (modelId) => {
    onModelChange(modelId);
    setIsOpen(false);
  };

  return (
    <div className={styles.modelSelector} ref={dropdownRef}>
      <button 
        className={styles.modelSelectorButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={styles.modelName}>{selectedModelData.name}</span>
        <svg 
          className={`${styles.arrow} ${isOpen ? styles.arrowUp : ''}`} 
          width="12" 
          height="8" 
          viewBox="0 0 12 8" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M1 1.5L6 6.5L11 1.5" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>
      
      {isOpen && (
        <div className={styles.dropdown} role="listbox">
          {models.map((model) => (
            <button
              key={model.id}
              className={`${styles.dropdownItem} ${
                selectedModel === model.id ? styles.selected : ''
              }`}
              onClick={() => handleModelSelect(model.id)}
              role="option"
              aria-selected={selectedModel === model.id}
            >
              {model.name}
              {selectedModel === model.id && (
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M20 6L9 17L4 12" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
      
      <div className={styles.modelTag}>
        {selectedModelData.id}
      </div>
    </div>
  );
};

export default ModelSelector;
