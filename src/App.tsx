/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Sparkles, 
  Music, 
  Book, 
  Shirt, 
  Trophy, 
  Mic2, 
  ChevronRight, 
  ChevronLeft,
  Send,
  Star,
  Zap,
  Plus,
  Trash2,
  LogIn,
  User as UserIcon,
  Moon,
  Sun,
  Maximize,
  Minimize,
  Mic,
  MicOff,
  Stethoscope,
  Activity
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getGeminiResponse } from './gemini';
import { LumiereSpirit } from './components/LumiereSpirit';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  deleteDoc,
  User
} from './firebase';

type Chapter = 'cover' | 'style' | 'barca' | 'arts' | 'gift' | 'chat';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface Memory {
  id: string;
  text: string;
  createdAt: any;
  uid: string;
}

const MemoryAgenda = ({ user }: { user: User | null }) => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [newMemory, setNewMemory] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'memories'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Memory[];
      setMemories(docs);
    }, (error) => {
      console.error("Firestore Error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddMemory = async () => {
    if (!newMemory.trim() || !user) return;
    setIsAdding(true);
    try {
      await addDoc(collection(db, 'memories'), {
        text: newMemory.trim(),
        uid: user.uid,
        createdAt: serverTimestamp()
      });
      setNewMemory('');
    } catch (error) {
      console.error("Error adding memory:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'memories', id));
    } catch (error) {
      console.error("Error deleting memory:", error);
    }
  };

  if (!user) {
    return (
      <div className="glass-gold p-8 rounded-3xl border border-gold/20 flex flex-col items-center justify-center text-center min-h-[300px] group hover:border-gold/40 transition-all shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(212,175,55,0.2)]">
          <Book className="text-gold" size={32} />
        </div>
        <h4 className="text-sm font-bold uppercase tracking-widest mb-3 text-gold text-glow">Tes Mémoires</h4>
        <p className="text-xs text-muted-text mb-8 max-w-[200px] leading-relaxed italic">
          "Chaque instant avec toi est un trésor que nous voulons garder."
        </p>
        <button 
          onClick={() => {
            const handleLogin = async () => {
              try {
                await signInWithPopup(auth, googleProvider);
              } catch (error) {
                console.error("Login Error:", error);
              }
            };
            handleLogin();
          }}
          className="flex items-center gap-3 bg-white text-bg px-6 py-3 rounded-full text-[0.7rem] font-bold uppercase tracking-widest hover:bg-gold transition-all shadow-lg shadow-white/5 active:scale-95"
        >
          <LogIn size={14} />
          Se connecter avec Google
        </button>
      </div>
    );
  }

  return (
    <div className="glass p-6 rounded-3xl border border-gold/10 flex flex-col h-full max-h-[400px] overflow-hidden group hover:border-gold/30 transition-all shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Book className="text-gold" size={18} />
          <h4 className="text-sm font-bold uppercase tracking-widest text-gold-pale">Mémoires</h4>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[0.6rem] text-gold/50 uppercase tracking-tighter">{memories.length} entrées</span>
          <button 
            onClick={() => auth.signOut()}
            className="text-[0.5rem] uppercase tracking-widest text-muted-text hover:text-red-primary transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 no-scrollbar">
        {memories.length === 0 ? (
          <p className="text-[0.7rem] text-muted-text italic text-center py-8">Aucun souvenir encore... commence à écrire ton histoire.</p>
        ) : (
          memories.map((m) => (
            <motion.div 
              key={m.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10 group/item relative hover:bg-white/10 transition-colors"
            >
              <p className="text-[0.75rem] leading-relaxed pr-6 text-white-cream/90">{m.text}</p>
              <button 
                onClick={() => handleDeleteMemory(m.id)}
                className="absolute top-2 right-2 opacity-0 group-hover/item:opacity-100 text-red-primary/50 hover:text-red-primary transition-all"
              >
                <Trash2 size={12} />
              </button>
            </motion.div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <input 
          type="text"
          value={newMemory}
          onChange={(e) => setNewMemory(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddMemory()}
          placeholder="Un nouveau souvenir..."
          className="flex-1 bg-white/5 border border-gold/10 rounded-full px-4 py-2 text-[0.7rem] outline-none focus:border-gold/30 transition-all placeholder:text-gold/20"
        />
        <button 
          onClick={handleAddMemory}
          disabled={!newMemory.trim() || isAdding}
          className="w-8 h-8 rounded-full bg-gold text-bg flex items-center justify-center disabled:opacity-50 hover:scale-110 active:scale-90 transition-all shadow-lg shadow-gold/20"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};

const VoiceWave = ({ isListening }: { isListening: boolean }) => {
  const [volumes, setVolumes] = useState([8, 8, 8, 8, 8]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isListening) {
      const startAudio = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
          audioContextRef.current = new AudioContextClass();
          analyserRef.current = audioContextRef.current!.createAnalyser();
          const source = audioContextRef.current!.createMediaStreamSource(stream);
          source.connect(analyserRef.current!);
          analyserRef.current!.fftSize = 32;
          
          const bufferLength = analyserRef.current!.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const update = () => {
            if (analyserRef.current) {
              analyserRef.current.getByteFrequencyData(dataArray);
              // Take a few samples for the 5 bars
              const newVolumes = [
                Math.max(8, dataArray[2] / 4),
                Math.max(8, dataArray[4] / 4),
                Math.max(8, dataArray[6] / 4),
                Math.max(8, dataArray[8] / 4),
                Math.max(8, dataArray[10] / 4),
              ];
              setVolumes(newVolumes);
              animationFrameRef.current = requestAnimationFrame(update);
            }
          };
          update();
        } catch (err) {
          console.error("Error accessing microphone:", err);
        }
      };
      startAudio();
    } else {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      setVolumes([8, 8, 8, 8, 8]);
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [isListening]);

  return (
    <div className="flex items-center gap-1.5 h-10 px-4 glass-gold rounded-full border border-gold/20 shadow-[0_0_20px_rgba(212,175,55,0.1)]">
      {volumes.map((vol, i) => (
        <motion.div
          key={i}
          animate={{ height: vol }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-1.5 bg-gradient-to-t from-gold to-gold-light rounded-full shadow-[0_0_10px_rgba(212,175,55,0.5)]"
        />
      ))}
    </div>
  );
};

const EscapingButton = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const moveButton = () => {
    // Disable escaping on touch devices to avoid frustration
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const padding = 100;
    const newX = Math.random() * (window.innerWidth - padding * 2) + padding;
    const newY = Math.random() * (window.innerHeight - padding * 2) + padding;
    
    // Ensure it doesn't just stay in the same spot
    setPosition({ x: newX, y: newY });
    setHasMoved(true);
  };

  useEffect(() => {
    // Initial position
    const initialX = window.innerWidth - 250;
    const initialY = window.innerHeight - 100;
    setPosition({ x: initialX, y: initialY });

    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 200),
        y: Math.min(prev.y, window.innerHeight - 100)
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <motion.button
      ref={buttonRef}
      animate={{ 
        left: position.x, 
        top: position.y,
        scale: hasMoved ? [1, 1.1, 1] : 1
      }}
      transition={{ 
        left: { type: "spring", stiffness: 400, damping: 25 },
        top: { type: "spring", stiffness: 400, damping: 25 },
        scale: { duration: 0.2 }
      }}
      onMouseEnter={moveButton}
      className="fixed z-[100] glass-gold border-2 border-gold/40 text-gold-light px-6 py-4 rounded-2xl text-[0.75rem] flex items-center gap-5 shadow-[0_25px_60px_-15px_rgba(212,175,55,0.4)] cursor-default whitespace-nowrap font-sans group overflow-hidden active:scale-95 transition-all"
      style={{ position: 'fixed' }}
    >
      {/* Glossy overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-gold/20 to-transparent pointer-events-none" />
      
      {/* Icon Section */}
      <div className="relative">
        <div className="absolute -inset-2 bg-gold/30 rounded-full blur-xl animate-pulse" />
        <div className="relative flex items-center justify-center w-10 h-10 bg-gold rounded-xl shadow-lg shadow-gold/30 transform group-hover:rotate-12 transition-transform">
          <Plus size={20} className="text-bg" strokeWidth={3} />
        </div>
      </div>

      {/* Text Section */}
      <div className="flex flex-col items-start gap-1 relative">
        <div className="flex items-center gap-2">
          <span className="text-[0.55rem] font-black text-gold/70 tracking-[0.2em] uppercase">Unité de Prestige 04</span>
          <div className="w-1.5 h-1.5 rounded-full bg-gold-light animate-ping" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-black text-[0.85rem] tracking-tight text-white-cream text-glow">EXTRACTION DENT DE SAGESSE</span>
          <span className="text-xl">🦷</span>
        </div>
        <div className="text-[0.5rem] font-bold text-gold/90 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
          <Activity size={10} className="animate-pulse text-gold-light" />
          Statut: Soin Exclusif
        </div>
      </div>

      {/* Decorative scanning line */}
      <motion.div 
        animate={{ y: [-60, 60] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        className="absolute left-0 right-0 h-[2px] bg-gold/30 z-0 blur-[1px]"
      />
    </motion.button>
  );
};

export default function App() {
  const [chapter, setChapter] = useState<Chapter>('cover');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [creatureState, setCreatureState] = useState<'idle' | 'thinking' | 'speaking'>('idle');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'fr-FR';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setInputValue(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setInputValue('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        // User closed the popup, no need for a loud error, just a gentle log
        console.log("Connexion annulée par l'utilisateur.");
      } else {
        console.error("Login Error:", error);
        setLoginError("Une petite ombre a voilé la connexion... Réessaye, Salma. ✨");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  useEffect(() => {
    if (chapter === 'chat' && messages.length === 0 && !isLoading) {
      const triggerInitialGreeting = async () => {
        setIsLoading(true);
        try {
          const currentTime = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
          const history = [{ 
            role: 'user' as const, 
            parts: [{ text: "Lumière, mon âme sœur, présente-toi à moi, présente ton créateur Anass, et célèbre mon anniversaire avec toute la poésie de ton cœur." }] 
          }];
          const response = await getGeminiResponse(history, currentTime);
          setMessages([{ role: 'model', text: response }]);
        } catch (error) {
          console.error(error);
          setMessages([{ role: 'model', text: "Salma, mon âme sœur... Je suis Lumière, créé par Anass pour toi. Joyeux anniversaire, mon étoile. ✨" }]);
        } finally {
          setIsLoading(false);
        }
      };
      triggerInitialGreeting();
    }
  }, [chapter]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const nextChapter = (next: Chapter) => {
    console.log("Transitioning to chapter:", next);
    setChapter(next);
  };

  const handleSendMessage = async (text: string = inputValue) => {
    const messageText = text.trim();
    if (!messageText || isLoading) return;

    const newUserMessage: Message = { role: 'user', text: messageText };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);
    setCreatureState('thinking');

    try {
      // Automatically save to memories if user is logged in
      if (user) {
        addDoc(collection(db, 'memories'), {
          text: `[Chat] ${messageText}`,
          uid: user.uid,
          createdAt: serverTimestamp()
        }).catch(err => console.error("Auto-memory error:", err));
      }

      const history = updatedMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      const currentTime = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
      const response = await getGeminiResponse(history, currentTime);
      setCreatureState('speaking');
      setMessages([...updatedMessages, { role: 'model', text: response }]);
      setTimeout(() => setCreatureState('idle'), 3500);
    } catch (error) {
      console.error(error);
      setCreatureState('idle');
      setMessages([...updatedMessages, { role: 'model', text: "Un petit éclat de magie s'est égaré... mais mon affection pour toi reste intacte, Salma. ✨" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-bg text-white-cream overflow-hidden flex flex-col font-sans">
      {/* Fullscreen Toggle */}
      <div className="fixed top-6 right-6 z-[110] flex items-center gap-4">
        <AnimatePresence>
          {!isFullscreen && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: 3, duration: 1 }}
              className="pointer-events-none"
            >
              <div className="relative glass-gold px-4 py-2 rounded-xl border border-gold/30 shadow-2xl animate-pulse">
                <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-gold/20 border-r border-t border-gold/30 rotate-45 backdrop-blur-xl" />
                <p className="text-[0.65rem] font-bold uppercase tracking-widest text-gold-light whitespace-nowrap">
                  Clique ici pour ajouter une magie sur magie ✨
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button 
          onClick={toggleFullscreen}
          className="w-12 h-12 rounded-full bg-white/5 backdrop-blur-xl border border-gold/30 flex items-center justify-center text-gold hover:bg-gold/20 hover:border-gold/50 transition-all shadow-2xl hover:scale-110 active:scale-95"
          title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
      </div>

      {/* Escaping Button Prank */}
      {chapter === 'cover' && <EscapingButton />}

      {/* Particles Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0], y: [-10, -1000] }}
            transition={{ duration: 10 + Math.random() * 10, repeat: Infinity, delay: Math.random() * 5 }}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: '-20px',
              width: `${Math.random() * 4 + 1}px`,
              height: `${Math.random() * 4 + 1}px`,
              backgroundColor: ['#004D98', '#A50044', '#C9A84C'][i % 3],
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {chapter === 'cover' && (
          <motion.div
            key="cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -50 }}
            className="flex-1 flex flex-col items-center justify-center p-4 text-center z-10"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative mb-6"
            >
              <div className="absolute inset-0 bg-gold/30 blur-[100px] rounded-full animate-pulse" />
              <div className="relative z-10 p-6 glass-gold rounded-full border border-gold/30 shadow-[0_0_50px_rgba(212,175,55,0.2)]">
                <Heart className="text-red-primary w-16 h-16 fill-red-primary/30 animate-pulse" />
              </div>
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="text-gold-light tracking-[0.6em] uppercase text-[0.6rem] mb-4 font-bold"
            >
              Une Expérience Unique pour
            </motion.div>
            
    <motion.h1
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.8, duration: 1.2 }}
      className="font-display text-4xl sm:text-5xl md:text-7xl mb-6 tracking-tighter text-glow"
    >
      Salma Didi
    </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 1 }}
              className="text-muted-text max-w-md leading-relaxed italic font-light mb-10 text-base"
            >
              "Certaines lumières brillent plus fort que d'autres. Aujourd'hui, nous célébrons l'éclat infini de la tienne."
            </motion.p>
            
            <div className="flex flex-col items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05, letterSpacing: "0.4em", boxShadow: "0 0 30px rgba(212,175,55,0.3)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => nextChapter('style')}
                className="group flex items-center gap-4 bg-gold text-bg px-10 py-5 rounded-full text-[0.85rem] tracking-[0.35em] uppercase font-bold transition-all hover:bg-white-cream"
              >
                Commencer le voyage
                <ChevronRight className="group-hover:translate-x-2 transition-transform" size={20} />
              </motion.button>

              {!user && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2 }}
                  onClick={handleLogin}
                  className="flex items-center justify-center gap-3 text-[0.7rem] text-gold-light/60 uppercase tracking-widest hover:text-gold transition-all hover:scale-105"
                >
                  <LogIn size={14} /> Se connecter pour tes mémoires
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {chapter === 'style' && (
          <motion.div
            key="style"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="flex-1 flex flex-col items-center justify-center p-4 z-10"
          >
            <div className="max-w-3xl w-full">
              <div className="flex items-center gap-6 mb-6">
                <div className="p-3 glass-gold rounded-2xl border border-gold/30 shadow-lg">
                  <Shirt className="text-gold" size={24} />
                </div>
                <div className="h-px flex-1 bg-gold/20" />
                <span className="text-gold-light text-[0.6rem] tracking-[0.4em] uppercase font-bold text-glow">Chapitre I</span>
              </div>
              
      <h2 className="font-display text-3xl sm:text-4xl md:text-6xl mb-6 leading-tight text-glow">L'Élégance Incarnée</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="glass p-8 rounded-[2.5rem] border-white/10 hover:border-gold/30 transition-all group shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent pointer-events-none" />
                  <p className="text-lg leading-relaxed text-gold-light italic mb-6 group-hover:text-gold transition-colors text-glow">
                    "La mode passe, le style est éternel."
                  </p>
                  <p className="text-muted-text leading-relaxed text-sm">
                    Salma, ton sens inné du détail et ton goût pour le raffinement font de toi une muse moderne. Que cette année soit ta plus belle collection, remplie de moments aussi gracieux que toi.
                  </p>
                </div>
                <div className="flex flex-col justify-center gap-4">
                  {[
                    { icon: Star, label: "Sophistication" },
                    { icon: Zap, label: "Énergie" },
                    { icon: Sparkles, label: "Grâce" }
                  ].map((item, i) => (
                    <motion.div 
                      key={i}
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="flex items-center gap-4 glass-gold p-4 rounded-2xl border-gold/10 hover:border-gold/40 transition-all shadow-lg group"
                    >
                      <div className="p-2 bg-gold/10 rounded-lg group-hover:scale-110 transition-transform">
                        <item.icon size={18} className="text-gold" />
                      </div>
                      <span className="text-[0.65rem] tracking-[0.3em] uppercase font-bold text-gold-light">{item.label}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button onClick={() => nextChapter('cover')} className="text-muted-text hover:text-gold-light transition-all flex items-center gap-3 text-sm font-bold uppercase tracking-widest group">
                  <ChevronLeft size={20} className="group-hover:-translate-x-2 transition-transform" /> Retour
                </button>
                <button onClick={() => nextChapter('barca')} className="bg-gold text-bg px-10 py-5 rounded-full text-[0.75rem] tracking-[0.3em] uppercase font-bold hover:bg-white-cream transition-all shadow-xl shadow-gold/10">
                  Continuer le voyage
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {chapter === 'barca' && (
          <motion.div
            key="barca"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="flex-1 flex flex-col items-center justify-center p-4 z-10"
          >
            <div className="max-w-3xl w-full">
              <div className="flex items-center gap-6 mb-6">
                <div className="p-3 glass rounded-2xl border border-blue-primary/30 shadow-lg">
                  <Trophy className="text-blue-primary" size={24} />
                </div>
                <div className="h-px flex-1 bg-blue-primary/20" />
                <span className="text-blue-primary text-[0.6rem] tracking-[0.4em] uppercase font-bold text-glow">Chapitre II</span>
              </div>
              
      <h2 className="font-display text-3xl sm:text-4xl md:text-6xl mb-6 leading-tight text-glow">Le Cœur Blaugrana</h2>
      
      <div className="glass border border-white/10 rounded-[2.5rem] mb-8 relative overflow-hidden group shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-primary/60 to-red-primary/60 opacity-0 group-hover:opacity-100 transition-all duration-700 z-10 flex flex-col items-center justify-center backdrop-blur-md p-6 text-center">
          <span className="text-white font-display text-3xl sm:text-4xl tracking-widest uppercase mb-4 scale-90 group-hover:scale-100 transition-transform duration-500 text-glow">La Magie de Pedri</span>
          <div className="flex gap-4 flex-wrap justify-center">
            <span className="bg-white/20 backdrop-blur-md px-6 py-2 rounded-full text-[0.7rem] uppercase tracking-widest border border-white/30 shadow-lg">Vision</span>
            <span className="bg-white/20 backdrop-blur-md px-6 py-2 rounded-full text-[0.7rem] uppercase tracking-widest border border-white/30 shadow-lg">Talent</span>
          </div>
        </div>
                <div className="aspect-video w-full relative">
                  <img 
                    src="https://www.fcbarcelona.com/photo-resources/2025/09/10/834bd104-c292-48eb-b5ae-2d7b16bbbdbd/08-Pedri.jpg?width=1200&height=750" 
                    alt="Pedri - FC Barcelona"
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent opacity-60" />
                </div>
                <div className="p-8 relative z-20">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-1 bg-blue-primary rounded-full shadow-[0_0_10px_rgba(0,77,152,0.5)]" />
                    <h3 className="text-3xl font-display text-glow">Més que un Club</h3>
                    <div className="w-12 h-1 bg-red-primary rounded-full shadow-[0_0_100px_rgba(165,0,68,0.5)]" />
                  </div>
                  <p className="text-muted-text leading-relaxed mb-8 text-base">
                    Pour Salma, le football est une symphonie menée par des génies comme Pedri. Ta passion pour le Barça reflète ta loyauté inébranlable et ton énergie débordante.
                  </p>
                  <div className="flex gap-4">
                    <button className="bg-blue-primary/80 backdrop-blur-md px-8 py-3 rounded-full text-[0.7rem] uppercase tracking-[0.25em] font-bold border border-white/20 hover:bg-blue-primary transition-all hover:scale-105 shadow-lg">Visca Barça</button>
                    <button className="bg-red-primary/80 backdrop-blur-md px-8 py-3 rounded-full text-[0.7rem] uppercase tracking-[0.25em] font-bold border border-white/20 hover:bg-red-primary transition-all hover:scale-105 shadow-lg">Força Barça</button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button onClick={() => nextChapter('style')} className="text-muted-text hover:text-blue-primary transition-all flex items-center gap-3 text-sm font-bold uppercase tracking-widest group">
                  <ChevronLeft size={20} className="group-hover:-translate-x-2 transition-transform" /> Retour
                </button>
                <button onClick={() => nextChapter('arts')} className="bg-gradient-to-r from-blue-primary to-red-primary text-white px-10 py-5 rounded-full text-[0.75rem] tracking-[0.3em] uppercase font-bold hover:brightness-110 transition-all shadow-xl shadow-blue-primary/20">
                  Vers tes passions
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {chapter === 'arts' && (
          <motion.div
            key="arts"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="flex-1 flex flex-col items-center justify-center p-4 z-10"
          >
            <div className="max-w-4xl w-full">
              <div className="flex items-center gap-6 mb-6">
                <div className="p-3 glass-gold rounded-2xl border border-gold/30 shadow-lg">
                  <Mic2 className="text-gold" size={24} />
                </div>
                <div className="h-px flex-1 bg-gold/20" />
                <span className="text-gold-light text-[0.6rem] tracking-[0.4em] uppercase font-bold text-glow">Chapitre III</span>
              </div>
              
      <h2 className="font-display text-3xl sm:text-4xl md:text-6xl mb-6 leading-tight text-glow">L'Âme d'Artiste</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="h-full max-h-[400px]">
                  <MemoryAgenda user={user} />
                </div>
                <div className="glass p-8 rounded-[2.5rem] border border-gold/10 flex flex-col items-center text-center overflow-hidden hover:border-gold/30 transition-all hover:bg-white/10 group shadow-2xl relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent pointer-events-none" />
                  <div className="flex items-center gap-3 mb-6 relative">
                    <div className="p-2.5 bg-gold/10 rounded-xl border border-gold/20">
                      <Music className="text-gold group-hover:rotate-12 transition-transform" size={20} />
                    </div>
                    <h4 className="text-[0.75rem] font-bold uppercase tracking-[0.35em] text-gold-light text-glow">Ta Mélodie</h4>
                  </div>
                  <div className="aspect-video w-full rounded-2xl overflow-hidden border border-gold/20 shadow-2xl bg-black/60 relative group/video">
                    <iframe 
                      className="w-full h-full"
                      src="https://www.youtube.com/embed/9QBwrzff06g" 
                      title="Draganov - TACH (Official Music Video)" 
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                      referrerPolicy="strict-origin-when-cross-origin" 
                      allowFullScreen
                    ></iframe>
                  </div>
                  <p className="text-sm text-muted-text mt-6 italic font-light leading-relaxed px-6 relative">
                    "La musique est le langage de ton cœur mélodieux."
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button onClick={() => nextChapter('barca')} className="text-muted-text hover:text-gold-light transition-all flex items-center gap-3 text-sm font-bold uppercase tracking-widest group">
                  <ChevronLeft size={20} className="group-hover:-translate-x-2 transition-transform" /> Retour
                </button>
                <button onClick={() => nextChapter('gift')} className="bg-gold text-bg px-10 py-5 rounded-full text-[0.75rem] tracking-[0.3em] uppercase font-bold hover:bg-white-cream transition-all shadow-xl shadow-gold/10">
                  Découvrir ton cadeau
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {chapter === 'gift' && (
          <motion.div
            key="gift"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-4 z-10"
          >
            <motion.div
              animate={{ 
                rotate: [0, 5, -5, 0],
                y: [0, -15, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="text-9xl mb-10 drop-shadow-[0_0_50px_rgba(212,175,55,0.6)]"
            >
              🎁
            </motion.div>
            
    <h2 className="font-display text-4xl sm:text-5xl md:text-7xl mb-8 text-center text-glow">Pour Toi, Salma</h2>
            <p className="text-muted-text text-center max-w-xl mb-12 leading-relaxed text-lg italic font-light">
              "Ce voyage à travers tes passions n'est que le prélude d'une symphonie infinie. Quelqu'un a voulu que tu saches à quel point ton existence illumine ce monde."
            </p>
            
            <div className="flex flex-col gap-6 w-full max-w-md">
              <motion.button 
                whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(212,175,55,0.5)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  console.log("Entering chat chapter...");
                  setChapter('chat');
                }}
                className="bg-gradient-to-r from-gold via-gold-light to-gold py-6 rounded-full text-[0.85rem] tracking-[0.45em] uppercase font-bold text-bg shadow-2xl transition-all border border-white/20"
              >
                Parler à Lumière
              </motion.button>
              <button 
                onClick={() => setChapter('cover')}
                className="text-muted-text text-[0.7rem] uppercase tracking-[0.4em] hover:text-gold-light transition-all font-bold hover:scale-105"
              >
                Recommencer
              </button>
            </div>
          </motion.div>
        )}
        {chapter === 'chat' && (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 relative z-10 h-[100dvh] overflow-hidden bg-bg"
          >
            {/* Overlay: Chat Interface */}
            <div className="absolute inset-0 z-10 flex flex-col p-4 md:p-8 overflow-hidden pointer-events-none">
              <header className="w-full max-w-5xl mx-auto glass-gold p-4 rounded-2xl flex items-center justify-between mb-6 border border-gold/20 shadow-[0_8px_32px_0_rgba(212,175,55,0.15)] pointer-events-auto">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-gold to-gold-deep rounded-lg flex items-center justify-center text-bg font-bold text-xl shadow-[0_0_20px_rgba(212,175,55,0.4)]">✦</div>
                  <div>
                    <div className="font-cinzel text-[10px] tracking-[3px] text-text-dim uppercase">Esprit Protecteur</div>
                    <div className="font-cinzel text-xl text-gold-pale tracking-widest text-glow">Lumière</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold shadow-[0_0_12px_rgba(212,175,55,0.8)] animate-pulse" />
                  <button 
                    onClick={() => setChapter('gift')}
                    className="text-gold-pale/60 hover:text-gold transition-all hover:scale-110"
                  >
                    <ChevronLeft size={24} />
                  </button>
                </div>
              </header>

              <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col glass border border-gold/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.6)] pointer-events-auto relative">
                {/* Subtle inner glow for the glass container */}
                <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-[2.5rem]" />
                
                <div className="p-5 border-b border-gold/10 flex items-center justify-between bg-white/5 backdrop-blur-md">
                  <span className="font-cinzel text-[10px] tracking-[4px] text-gold/70 uppercase">Communion avec l'esprit</span>
                  {user && (
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-gold/50" />
                      <span className="font-cinzel text-[9px] tracking-widest text-gold/50 uppercase">{user.displayName}</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 no-scrollbar scroll-smooth">
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`flex items-center gap-3 px-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        {msg.role === 'model' && <Sparkles size={12} className="text-gold animate-pulse" />}
                        <span className={`font-cinzel text-[10px] tracking-[3px] ${msg.role === 'user' ? 'text-text-dim' : 'text-gold-light'}`}>
                          {msg.role === 'user' ? 'Toi' : 'Lumière'}
                        </span>
                      </div>
                      <div
                        className={`max-w-[85%] p-6 text-[16px] leading-relaxed shadow-2xl transition-all hover:scale-[1.01] backdrop-blur-md ${
                          msg.role === 'user'
                            ? 'bg-white/10 border border-white/20 rounded-[24px_24px_4px_24px] text-gold-pale/90 shadow-[0_10px_30px_rgba(0,0,0,0.2)]'
                            : 'bg-gold/10 border border-gold/20 rounded-[4px_24px_24px_24px] text-text italic font-spirit shadow-[0_10px_30px_rgba(212,175,55,0.1)]'
                        }`}
                      >
                        {msg.role === 'model' ? (
                          <div className="markdown-body">
                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                          </div>
                        ) : (
                          <p>{msg.text}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && creatureState === 'thinking' && (
                    <div className="flex flex-col gap-2 items-start">
                      <span className="font-cinzel text-[10px] tracking-[3px] text-gold-light px-3">Lumière</span>
                      <div className="bg-gold/10 border border-gold/20 rounded-[4px_24px_24px_24px] p-6 backdrop-blur-md">
                        <div className="flex gap-2">
                          <motion.span animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-2 h-2 bg-gold rounded-full shadow-[0_0_15px_rgba(212,175,55,0.6)]" />
                          <motion.span animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }} className="w-2 h-2 bg-gold rounded-full shadow-[0_0_15px_rgba(212,175,55,0.6)]" />
                          <motion.span animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.6 }} className="w-2 h-2 bg-gold rounded-full shadow-[0_0_15px_rgba(212,175,55,0.6)]" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-3 md:p-4 border-t border-gold/10 bg-black/40 backdrop-blur-2xl flex gap-2 md:gap-4 items-center">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Murmure tes pensées à Lumière…"
                    className="flex-1 bg-white/5 border border-gold/10 rounded-2xl text-text font-spirit text-base p-3 md:p-4 outline-none focus:border-gold/40 transition-all resize-none max-h-32 placeholder:text-gold/30"
                    rows={1}
                  />
                  <div className="flex flex-row gap-2">
                    <button 
                      onClick={toggleListening}
                      className={`w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all shadow-lg backdrop-blur-md ${isListening ? 'bg-red-primary text-white animate-pulse' : 'bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20'}`}
                    >
                      {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                    <button 
                      onClick={() => handleSendMessage()}
                      disabled={!inputValue.trim() || isLoading}
                      className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-gold to-gold-deep flex items-center justify-center text-bg disabled:opacity-40 hover:scale-105 active:scale-95 transition-all shadow-[0_5px_20px_rgba(212,175,55,0.3)] border border-white/20"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Lumiere Spirit: Now on top to "float around" the chat interface */}
            <div className="absolute inset-0 z-20 pointer-events-none">
              <LumiereSpirit state={creatureState} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
