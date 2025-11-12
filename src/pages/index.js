import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import styles from '../styles/Home.module.css';

// Dynamically import the ChatContainer with SSR disabled to avoid hydration issues
const ChatContainer = dynamic(
  () => import('../components/ChatContainer'),
  { ssr: false }
);

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [theme, setTheme] = useState('light');

  // Set theme based on user preference or system preference
  useEffect(() => {
    setIsClient(true);
    
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      const systemTheme = prefersDark ? 'dark' : 'light';
      setTheme(systemTheme);
      document.documentElement.setAttribute('data-theme', systemTheme);
    }
  }, []);

  // Toggle between light and dark theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  if (!isClient) {
    // Show a simple loading state or skeleton while loading
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Mark AI</title>
        <meta name="description" content="AI Chat powered by Andromeda" />
        <link rel="icon" href="/mark-ai.png" />
      </Head>

      <main className={styles.main}>
        <ChatContainer />
      </main>

      {/* <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <span>Lumina - AI Chat</span>
          <button 
            className={styles.themeToggle}
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </footer> */}
    </div>
  );
}