import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import './App.css';
import Nabbar from './component/Nabbar';
import FractalAudioReactive from './component/blob';
import Terminal from './component/Terminal';
import Status from './component/Status';
import { ClockWeatherHUD, TacticalMapHUD } from './component/AdvancedHUD';
import TacticalRotator from './component/TacticalRotator';
import { UnifiedTacticalHUD } from './component/UnifiedDiagnostics';
import { NeuralWaveform, ScanningHexGrid } from './component/FuturisticGauges';

let BACKEND = process.env.REACT_APP_BACKEND_URL;
if (!BACKEND) {
  if (window.location.hostname === 'localhost') {
    BACKEND = 'http://localhost:5001';
  } else {
    BACKEND = '';
  }
} else {
  BACKEND = BACKEND.startsWith('http') ? BACKEND : `https://${BACKEND}`;
}

// 🛡️ UNBREAKABLE PRODUCTION OVERRIDE:
if (window.location.hostname.includes('onrender.com')) {
  BACKEND = 'https://jarvis-backend-d5gf.onrender.com';
}
const BACKEND_URL = BACKEND;

const DataStream = ({ position }) => {
  const [data, setData] = useState([]);
  useEffect(() => {
    const interval = setInterval(() => {
      const hex = Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0');
      setData(prev => [hex, ...prev].slice(0, 15));
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`data-stream ${position}`}>
      {data.map((h, i) => (
        <div key={i} style={{ opacity: 1 - i * 0.06, fontSize: '0.6rem' }}>
          0x{h} {'//'} SYNC_{Math.floor(Math.random()*100)}
        </div>
      ))}
    </div>
  );
};

const NeuralLines = ({ positions }) => {
  return (
    <svg className="neural-connections" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1, opacity: 0.1 }}>
      {Object.keys(positions).map(key => (
        <line 
          key={key}
          x1="50%" y1="50%" 
          x2={positions[key].x + (key === 'hud' || key === 'terminal' ? 100 : window.innerWidth - 100)} 
          y2={positions[key].y + (key === 'hud' || key === 'status' ? 80 : window.innerHeight - 80)}
          stroke="rgba(0, 255, 255, 0.15)"
          strokeWidth="1"
          strokeDasharray="5,15"
          className="neural-line"
        />
      ))}
    </svg>
  );
};

function App() {
  const [blobConfig, setBlobConfig] = useState({ colorPreset: 'Default', shape: 'Auto', scaleMult: 1.0, sensitivity: 1.0, dragEnabled: false });

  // Classic Airy Layout (based on user screenshot)
  const [positions, setPositions] = useState({
    terminal: { x: 30, y: 250 },
    map: { x: 30, y: Math.max(window.innerHeight - 250, 600) },
    hud: { x: Math.max(window.innerWidth - 340, 450), y: 120 },
    status: { x: Math.max(window.innerWidth - 340, 450), y: 320 },
    tactical: { x: Math.max(window.innerWidth - 340, 450), y: Math.max(window.innerHeight - 200, 550) },
  });

  const [zIndices, setZIndices] = useState({ hud: 100, status: 100, terminal: 100, map: 100, tactical: 100, blob: 0 });

  const [systemStats, setSystemStats] = useState({ 
    cpu: 5, ram: 0, uptime: 0, processes: [], memDetail: { total: 0, used: 0, free: 0 },
    awareness: { location: 'GLOBAL CORE', battery: { level: 100, status: 'AC' }, wifi: { ssid: 'ACTIVE LINK', signal: 0 }, bluetooth: 'OFF' }
  });
  const [aiLatency, setAiLatency] = useState(0);

  // Refs removed — layout is locked

  useEffect(() => {
    try { 
      let stored = localStorage.getItem('cyber-sahiyogi-v3-layout');
      if (stored) setPositions(prev => ({ ...prev, ...JSON.parse(stored) })); 
    } catch (e) {}
  }, []);

  const bringToFront = (comp) => {
    setZIndices(prev => {
      const keys = Object.keys(prev);
      const maxZ = Math.max(...keys.map(k => prev[k]));
      return { ...prev, [comp]: maxZ + 1 };
    });
  };

  useEffect(() => {
    try { localStorage.setItem('cyber-sahiyogi-v3-layout', JSON.stringify(positions)); } catch (e) {}
  }, [positions]);

  const [chatHistory, setChatHistory] = useState([]);
  const [interimText, setInterimText] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionRef = useRef(null);
  const socketRef = useRef(null);
  const isProcessingRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const audioRef = useRef(null);
  const audioBufferRef = useRef({});
  const nextAudioSeqToPlayRef = useRef(0);

  // ── Browser Battery Intelligence (Frontend Source of Truth) ──
  useEffect(() => {
    if ('getBattery' in navigator) {
      navigator.getBattery().then(batt => {
        const update = () => {
          setSystemStats(prev => ({
            ...prev, awareness: { ...prev.awareness, battery: { level: Math.round(batt.level * 100), status: batt.charging ? 'CHARGING' : 'DISCHARGING' } }
          }));
        };
        batt.addEventListener('levelchange', update);
        batt.addEventListener('chargingchange', update);
        update();
      });
    }
  }, []);

  useEffect(() => {
    // V7.1.1 STABLE SOCKET CONNECTION
    const socket = io(BACKEND_URL, { 
       transports: ['websocket', 'polling'], 
       upgrade: true, 
       credentials: true 
    });
    socketRef.current = socket;
    socket.on('connect', () => { setBackendConnected(true); console.log("NEURAL LINK: Synchronized with Backend."); });
    socket.on('disconnect', () => setBackendConnected(false));
    
    socket.on('jarvis:heartbeat', (data) => {
      setSystemStats(prev => {
        // V7.1.2 ROBUST MERGE (Absolute Protection of Local Battery)
        const merged = { ...prev, ...data };
        
        // If we have a local battery from navigator.getBattery(), keep it
        // and only merge other awareness fields (location, wifi, etc.)
        if (prev.awareness?.battery && prev.awareness.battery.status !== 'AC') {
           merged.awareness = { 
             ...data.awareness, 
             battery: prev.awareness.battery 
           };
        } else if (data.awareness?.battery) {
           // Fallback to backend only if we don't have a reliable local one
           merged.awareness = { ...data.awareness };
        } else {
           // Ensure we don't lose the local battery even if data.awareness is missing it
           merged.awareness = { ...data.awareness, battery: prev.awareness?.battery || { level: 100, status: 'UNKNOWN' } };
        }
        
        return merged;
      });
    });
    
    socket.on('jarvis:cognition', (d) => setAiLatency(d.latency));

    socket.on('jarvis:done', (d) => {
      setChatHistory(prev => [...prev, { role: 'assistant', content: d.text }]);
      setStreamingText(''); setIsProcessing(false); isProcessingRef.current = false;
    });

    socket.on('jarvis:error', (d) => {
      setChatHistory(prev => [...prev, { role: 'assistant', content: `[ERROR] ${d.message}` }]);
      setIsProcessing(false); isProcessingRef.current = false;
      setStreamingText('');
    });

    socket.on('jarvis:audio', (d) => {
      if (d.audio && d.seq !== undefined) {
        audioBufferRef.current[d.seq] = d.audio;
        const playNext = async () => {
          if (audioRef.current) return;
          const seq = nextAudioSeqToPlayRef.current;
          const b64 = audioBufferRef.current[seq];
          if (!b64) {
            if (!isProcessingRef.current && !Object.keys(audioBufferRef.current).some(k => parseInt(k) > seq)) {
              isSpeakingRef.current = false; setIsSpeaking(false);
              if (recognitionRef.current) try { recognitionRef.current.start(); } catch (e) {}
            }
            return;
          }
          isSpeakingRef.current = true; setIsSpeaking(true);
          delete audioBufferRef.current[seq];
          nextAudioSeqToPlayRef.current = seq + 1;
          const blob = new Blob([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], { type: 'audio/mpeg' });
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;
          if (recognitionRef.current) try { recognitionRef.current.stop(); } catch (e) {}
          audio.onended = () => { URL.revokeObjectURL(url); audioRef.current = null; playNext(); };
          audio.play().catch(() => { audioRef.current = null; playNext(); });
        };
        playNext();
      }
    });

    return () => socket.disconnect();
  }, []);

  const sendMessage = useCallback((text) => {
    if (!text.trim() || isProcessingRef.current) return;
    isProcessingRef.current = true; setIsProcessing(true);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    audioBufferRef.current = {}; nextAudioSeqToPlayRef.current = 0;
    isSpeakingRef.current = false; setIsSpeaking(false);
    setChatHistory(prev => [...prev, { role: 'user', content: text }]);
    socketRef.current?.emit('jarvis:send', { text });
  }, []);

  const isStartingRef = useRef(false);
  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;
    
    let rec;
    const startRecognition = () => {
      if (isStartingRef.current || isProcessingRef.current || isSpeakingRef.current) return;
      try {
        isStartingRef.current = true;
        rec = new SpeechRec();
        rec.continuous = true; rec.interimResults = true; rec.lang = 'en-IN';
        recognitionRef.current = rec;
        
        rec.onstart = () => { setIsListening(true); isStartingRef.current = false; };
        rec.onresult = (e) => {
          if (isSpeakingRef.current) return;
          let finalStr = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const transcript = e.results[i][0].transcript;
            if (e.results[i].isFinal) finalStr += transcript;
            else setInterimText(transcript);
          }
          if (finalStr.trim().length > 0 && finalStr.toLowerCase().includes('jarvis')) {
            sendMessage(finalStr.trim()); setInterimText('');
          }
        };
        
        rec.onerror = (e) => {
          console.error("Speech Error:", e.error);
          isStartingRef.current = false;
          setIsListening(false);
          if (e.error === 'not-allowed') { console.warn("Mic Access Denied."); return; }
        };

        rec.onend = () => { 
          setIsListening(false); 
          isStartingRef.current = false;
          // Robust recovery with delay
          setTimeout(() => {
            if (!isProcessingRef.current && !isSpeakingRef.current) startRecognition();
          }, 1000); 
        };
        
        rec.start();
      } catch (e) { isStartingRef.current = false; }
    };

    startRecognition();
    return () => { if (rec) rec.stop(); };
  }, [sendMessage]);

  const getReClass = () => isListening ? 'active-listening' : isProcessing ? 'active-processing' : isSpeaking ? 'active-speaking' : '';

  return (
    <div className={`app-container reactivity-container ${getReClass()}`}>
      <div className="hud-grid-overlay"></div>
      
      <div className="global-background-layer">
        <ScanningHexGrid />
        <div className="global-waveform-wrapper">
          <NeuralWaveform isActive={isProcessing || isSpeaking} color={isProcessing ? "#f0f" : "#0ff"} amplitude={30} speed={0.06} />
        </div>
      </div>

      <TacticalRotator isListening={isListening} isProcessing={isProcessing} />
      <DataStream position="left" />
      <DataStream position="right" />
      <NeuralLines positions={positions} />
      
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: zIndices.blob }}>
        <FractalAudioReactive config={blobConfig} />
      </div>

      <div className="advanced-hud-wrapper">
        <Nabbar blobConfig={blobConfig} setBlobConfig={setBlobConfig} />

        <div className="hud-component-fixed" style={{ zIndex: zIndices.hud, position: 'absolute', left: positions.hud.x, top: positions.hud.y }} onMouseDown={() => bringToFront('hud')}>
          <ClockWeatherHUD isListening={isListening} isProcessing={isProcessing} />
        </div>

        <div className="hud-component-fixed" style={{ zIndex: zIndices.status, position: 'absolute', left: positions.status.x, top: positions.status.y }} onMouseDown={() => bringToFront('status')}>
          <Status isListening={isListening} backendConnected={backendConnected} isProcessing={isProcessing} isSpeaking={isSpeaking} systemStats={systemStats} aiLatency={aiLatency} />
        </div>

        <div className="hud-component-fixed" style={{ zIndex: zIndices.map, position: 'absolute', left: positions.map.x, top: positions.map.y }} onMouseDown={() => bringToFront('map')}>
          <TacticalMapHUD />
        </div>

        <div className="hud-component-fixed" style={{ zIndex: zIndices.terminal, position: 'absolute', left: positions.terminal.x, top: positions.terminal.y }} onMouseDown={() => bringToFront('terminal')}>
          <Terminal chatHistory={chatHistory} interimText={interimText} isListening={isListening} streamingText={streamingText} isProcessing={isProcessing} isSpeaking={isSpeaking} onSendMessage={sendMessage} />
        </div>

        <div className="hud-component-fixed" style={{ zIndex: zIndices.tactical, position: 'absolute', left: positions.tactical.x, top: positions.tactical.y }} onMouseDown={() => bringToFront('tactical')}>
          <UnifiedTacticalHUD stats={systemStats} latency={aiLatency} />
        </div>

        <div className="core-sync-readout">
          <div className={`readout-dot ${backendConnected ? 'pulse-green' : ''}`}></div>
          <span style={{ color: backendConnected ? '#11f811' : 'rgba(0,255,255,0.3)' }}>
            {backendConnected ? 'NEURAL LINK ESTABLISHED' : `CORE OFFLINE [${BACKEND_URL}]`} {/* UPTIME */} {systemStats.uptime}s
          </span>
          <div className={`readout-dot ${backendConnected ? 'pulse-green' : ''}`}></div>
        </div>
      </div>
    </div>
  );
}

export default App;
