# AI Chat with Groq

A modern, responsive chat interface built with Next.js that allows you to interact with Groq's high-performance language models. This application provides a clean, user-friendly interface for chatting with AI models like Llama 3, Mixtral, and Gemma.

## Features

- 🚀 Real-time chat interface with streaming responses
- 🔄 Multiple AI model support (Llama 3, Mixtral, Gemma)
- 📝 Markdown support with syntax highlighting
- 📋 Code block copying with one click
- 🌓 Light/Dark mode
- 📱 Fully responsive design
- ⚡ Fast and efficient UI with React 18

## Prerequisites

- Node.js 16.14 or later
- npm or yarn
- Groq API key (get it from [Groq Console](https://console.groq.com/keys))

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-chat-groq.git
   cd ai-chat-groq
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory and add your Groq API key:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   The application will be available at [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm run lint` - Run ESLint

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GROQ_API_KEY` | Your Groq API key | Yes |
| `NEXT_PUBLIC_APP_NAME` | Application name | No |
| `NEXT_PUBLIC_APP_DESCRIPTION` | Application description | No |
| `DEBUG` | Enable debug logging | No |

## Project Structure

```
src/
├── components/         # Reusable UI components
├── pages/             # Application pages and API routes
├── styles/            # CSS Modules and global styles
└── utils/             # Utility functions
```

## Technologies Used

- [Next.js](https://nextjs.org/) - React framework
- [React](https://reactjs.org/) - UI library
- [Groq API](https://console.groq.com/) - High-performance AI models
- [Prism.js](https://prismjs.com/) - Syntax highlighting
- [React Icons](https://react-icons.github.io/react-icons/) - Icon library

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
