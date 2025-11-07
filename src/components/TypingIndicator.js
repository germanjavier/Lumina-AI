import styles from '../styles/TypingIndicator.module.css';

const TypingIndicator = () => {
  return (
    <div className={styles.typingIndicator}>
      <div className={styles.typingDots}>
        <div className={styles.typingDot}></div>
        <div className={styles.typingDot}></div>
        <div className={styles.typingDot}></div>
      </div>
      <span className={styles.typingText}>AI is thinking...</span>
    </div>
  );
};

export default TypingIndicator;
