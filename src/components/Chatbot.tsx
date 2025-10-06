import React, { useState, useRef, useEffect } from 'react';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { CloseIcon } from './icons/CloseIcon';
import { SendIcon } from './icons/SendIcon';
import { ChatMessage, PartNumber, QAReport } from '../types';
import { geminiService } from '../services/geminiService';

interface ChatbotProps {
  partsData: PartNumber[];
  reportsData: QAReport[];
}

export const Chatbot: React.FC<ChatbotProps> = ({ partsData, reportsData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0) {
      setMessages([
        { sender: 'bot', text: 'Hello! I am your QA data assistant. Ask me anything about the part number issues.' }
      ]);
    }
  };

  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: ChatMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const botResponse = await geminiService.getChatbotResponse(input, partsData, reportsData);
      const botMessage: ChatMessage = { sender: 'bot', text: botResponse };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Chatbot error:", error);
      const errorMessage: ChatMessage = { sender: 'bot', text: 'Sorry, I encountered an error. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <>
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 bg-atlas-blue text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-atlas-blue focus:ring-offset-2 transition-transform hover:scale-110"
        aria-label="Toggle Chatbot"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: '#4A90E2',
          color: 'white',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          cursor: 'pointer',
          transition: 'transform 0.2s ease',
          zIndex: 1000,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {isOpen ? <CloseIcon className="w-8 h-8" style={{ width: '32px', height: '32px' }} /> : <ChatBubbleIcon className="w-8 h-8" style={{ width: '32px', height: '32px' }} />}
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '104px',
          right: '24px',
          width: '320px',
          height: '448px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          border: '1px solid #e2e8f0',
          zIndex: 1000,
        }}>
          <header style={{
            backgroundColor: '#4A90E2',
            color: 'white',
            padding: '16px',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
          }}>
            <h3 style={{ margin: 0, fontWeight: '600', fontSize: '18px' }}>QA Data Assistant</h3>
          </header>
          <main style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            backgroundColor: '#f8fafc',
          }}>
            {messages.map((msg, index) => (
              <div key={index} style={{
                display: 'flex',
                marginBottom: '12px',
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  paddingLeft: '12px',
                  paddingRight: '12px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  borderRadius: '8px',
                  maxWidth: '240px',
                  backgroundColor: msg.sender === 'user' ? '#4A90E2' : '#e2e8f0',
                  color: msg.sender === 'user' ? 'white' : '#1e293b',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  wordWrap: 'break-word',
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-start',
                marginBottom: '12px',
              }}>
                <div style={{
                  paddingLeft: '12px',
                  paddingRight: '12px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  borderRadius: '8px',
                  backgroundColor: '#e2e8f0',
                  color: '#1e293b',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#64748b',
                      borderRadius: '50%',
                      animation: 'bounce 1.4s infinite ease-in-out',
                      animationDelay: '-0.32s',
                    }}></span>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#64748b',
                      borderRadius: '50%',
                      animation: 'bounce 1.4s infinite ease-in-out',
                      animationDelay: '-0.16s',
                    }}></span>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#64748b',
                      borderRadius: '50%',
                      animation: 'bounce 1.4s infinite ease-in-out',
                    }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </main>
          <footer style={{
            padding: '12px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'white',
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px',
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question..."
              disabled={isLoading}
              style={{
                flex: 1,
                paddingLeft: '12px',
                paddingRight: '12px',
                paddingTop: '8px',
                paddingBottom: '8px',
                border: '1px solid #cbd5e1',
                borderRadius: '9999px',
                outline: 'none',
                fontSize: '14px',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#4A90E2';
                e.target.style.boxShadow = '0 0 0 1px #4A90E2';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#cbd5e1';
                e.target.style.boxShadow = 'none';
              }}
            />
            <button
              onClick={handleSend}
              disabled={isLoading}
              style={{
                marginLeft: '8px',
                color: isLoading ? '#cbd5e1' : '#4A90E2',
                backgroundColor: 'transparent',
                border: 'none',
                padding: '8px',
                borderRadius: '50%',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'color 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.color = '#0ea5e9';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.color = '#4A90E2';
                }
              }}
            >
              <SendIcon className="w-6 h-6" style={{ width: '24px', height: '24px' }} />
            </button>
          </footer>
        </div>
      )}
      
      {/* Add keyframes for bounce animation */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1.0);
          }
        }
      `}</style>
    </>
  );
};
