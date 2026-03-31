import React, { useEffect, useRef, useState } from 'react';
import './Terminal.css';
import { TransmissionSpectrum } from './FuturisticGauges';

const Terminal = ({ chatHistory, interimText, isListening, streamingText, isProcessing, isSpeaking, onSendMessage }) => {
  const terminalRef = useRef(null);
  const [inputText, setInputText] = useState('');

  // Auto-scroll to bottom whenever new data comes in
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [chatHistory, interimText, streamingText]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim() && onSendMessage) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="terminal-wrapper">
      <div className="terminal-header drag-handle">
        <div className="status-indicator">
          <span className={`recording-dot ${isListening ? 'active' : ''}`}></span>
          {isListening ? 'CORE LISTENING...' : 'VOICE STANDBY'}
        </div>
        <div className="terminal-decorations">
          <TransmissionSpectrum isTransmitting={isProcessing || isSpeaking} />
          <span>// SYS.OUTPUT</span>
          <span>v.6.0.0</span>
        </div>
      </div>

      <div className="terminal-body" ref={terminalRef}>
        <div className="transcript-text">
          {chatHistory.length === 0 && !interimText && !streamingText && (
            <p className="placeholder-text">[ Awaiting vocal input... ]</p>
          )}

          {chatHistory.map((msg, index) => (
            <div key={index} className={`chat-message role-${msg.role}`}>
              <span className="msg-prefix">
                {msg.role === 'user' ? 'USER > ' : 'CYBER SAHIYOGI > '}
              </span>
              <span className={msg.role === 'assistant' ? 'typing-effect' : 'message-content'}>
                {msg.content}
              </span>
            </div>
          ))}

          {/* Streaming response — token by token */}
          {streamingText && (
            <div className="chat-message role-assistant streaming">
              <span className="msg-prefix">CYBER SAHIYOGI &gt; </span>
              <span className="typing-effect streaming-text">
                {streamingText}
                <span className="stream-cursor">▊</span>
              </span>
            </div>
          )}

          {/* Thinking indicator */}
          {isProcessing && !streamingText && (
            <div className="chat-message role-processing">
              <span className="msg-prefix">CYBER SAHIYOGI &gt; </span>
              <span className="thinking-dots">
                <span className="dot">●</span>
                <span className="dot">●</span>
                <span className="dot">●</span>
              </span>
            </div>
          )}

          {interimText && (
            <div className="chat-message role-interim">
              <span className="msg-prefix">USER (interim) &gt; </span>
              <span className="interim-text">{interimText}</span>
            </div>
          )}
        </div>
        {isListening && !streamingText && !isProcessing && <span className="cursor-blink">_</span>}
      </div>

      {/* Manual text input */}
      <form className="terminal-input-bar" onSubmit={handleSubmit}>
        <span className="input-prompt">&gt;</span>
        <input
          type="text"
          className="terminal-input"
          placeholder="Type a command..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isProcessing}
        />
        <button type="submit" className="send-btn" disabled={isProcessing || !inputText.trim()}>
          ⏎
        </button>
      </form>
    </div>
  );
};

export default Terminal;
