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
      <div className="bg-white/5 p-8 rounded-2xl border border-gold/10 flex flex-col items-center justify-center text-center min-h-[300px] group hover:border-gold/30 transition-all">
        <div className="w-16 h-16 rounded-full bg-gold/5 border border-gold/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          <Book className="text-gold" size={32} />
        </div>
        <h4 className="text-sm font-bold uppercase tracking-widest mb-3 text-gold">Tes Mémoires</h4>
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
          className="flex items-center gap-3 bg-white text-bg px-6 py-3 rounded-full text-[0.7rem] font-bold uppercase tracking-widest hover:bg-gold transition-all shadow-lg shadow-white/5"
        >
          <LogIn size={14} />
          Se connecter avec Google
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/5 p-6 rounded-2xl border border-gold/10 flex flex-col h-full max-h-[400px] overflow-hidden group hover:border-gold/30 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Book className="text-gold" size={18} />
          <h4 className="text-sm font-bold uppercase tracking-widest">Mémoires</h4>
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
              className="bg-white/5 p-3 rounded-xl border border-white/5 group/item relative"
            >
              <p className="text-[0.75rem] leading-relaxed pr-6">{m.text}</p>
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
          className="flex-1 bg-white/5 border border-gold/10 rounded-full px-4 py-2 text-[0.7rem] outline-none focus:border-gold/30 transition-all"
        />
        <button 
          onClick={handleAddMemory}
          disabled={!newMemory.trim() || isAdding}
          className="w-8 h-8 rounded-full bg-gold text-bg flex items-center justify-center disabled:opacity-50 hover:scale-105 transition-transform"
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
    <div className="flex items-center gap-1 h-8 px-4">
      {volumes.map((vol, i) => (
        <motion.div
          key={i}
          animate={{ height: vol }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-1 bg-gold rounded-full"
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
        left: { type: "spring", stiffness: 300, damping: 20 },
        top: { type: "spring", stiffness: 300, damping: 20 },
        scale: { duration: 0.2 }
      }}
      onMouseEnter={moveButton}
      className="fixed z-[100] bg-bg/90 backdrop-blur-md border-2 border-gold/50 text-gold-light px-6 py-4 rounded-2xl text-[0.75rem] flex items-center gap-5 shadow-[0_25px_60px_-15px_rgba(212,175,55,0.3)] cursor-default whitespace-nowrap font-sans group overflow-hidden"
      style={{ position: 'fixed' }}
    >
      {/* Glossy overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-gold/10 to-transparent pointer-events-none" />
      
      {/* Icon Section */}
      <div className="relative">
        <div className="absolute -inset-2 bg-gold/20 rounded-full blur-lg animate-pulse" />
        <div className="relative flex items-center justify-center w-10 h-10 bg-gold rounded-xl shadow-lg shadow-gold/20 transform group-hover:rotate-12 transition-transform">
          <Plus size={20} className="text-bg" strokeWidth={3} />
        </div>
      </div>

      {/* Text Section */}
      <div className="flex flex-col items-start gap-1 relative">
        <div className="flex items-center gap-2">
          <span className="text-[0.55rem] font-black text-gold/60 tracking-[0.2em] uppercase">Unité de Prestige 04</span>
          <div className="w-1 h-1 rounded-full bg-gold-light animate-ping" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-black text-[0.85rem] tracking-tight text-white-cream">EXTRACTION DENT DE SAGESSE</span>
          <span className="text-xl">🦷</span>
        </div>
        <div className="text-[0.5rem] font-bold text-gold/80 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
          <Activity size={10} className="animate-pulse" />
          Statut: Soin Exclusif
        </div>
      </div>

      {/* Decorative scanning line */}
      <motion.div 
        animate={{ y: [-40, 40] }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        className="absolute left-0 right-0 h-[1px] bg-gold/20 z-0"
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

  const nextChapter = (next: Chapter) => setChapter(next);

  const handleSendMessage = async (text: string = inputValue) => {
    const messageText = text.trim();
    if (!messageText || isLoading) return;

    const newUserMessage: Message = { role: 'user', text: messageText };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

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
      setMessages([...updatedMessages, { role: 'model', text: response }]);
    } catch (error) {
      console.error(error);
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
              <div className="relative z-10 p-6 glass-gold rounded-full border-gold/30">
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
              className="font-display text-5xl md:text-7xl mb-6 tracking-tighter text-glow"
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
                <div className="p-3 glass-gold rounded-2xl">
                  <Shirt className="text-gold" size={24} />
                </div>
                <div className="h-px flex-1 bg-gold/20" />
                <span className="text-gold-light text-[0.6rem] tracking-[0.4em] uppercase font-bold">Chapitre I</span>
              </div>
              
              <h2 className="font-display text-4xl md:text-6xl mb-6 leading-tight">L'Élégance Incarnée</h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="glass p-6 rounded-3xl border-white/5 hover:border-gold/20 transition-all group">
                  <p className="text-base leading-relaxed text-gold-light italic mb-4 group-hover:text-gold transition-colors">
                    "La mode passe, le style est éternel."
                  </p>
                  <p className="text-muted-text leading-relaxed text-xs">
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
                      className="flex items-center gap-4 glass-gold p-3 rounded-2xl border-gold/10 hover:border-gold/30 transition-all"
                    >
                      <item.icon size={18} className="text-gold" />
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
                <div className="p-3 glass rounded-2xl border-blue-primary/30">
                  <Trophy className="text-blue-primary" size={24} />
                </div>
                <div className="h-px flex-1 bg-blue-primary/20" />
                <span className="text-blue-primary text-[0.6rem] tracking-[0.4em] uppercase font-bold">Chapitre II</span>
              </div>
              
              <h2 className="font-display text-4xl md:text-6xl mb-6 leading-tight">Le Cœur Blaugrana</h2>
              
              <div className="glass border-white/5 rounded-[2rem] mb-8 relative overflow-hidden group shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-primary/40 to-red-primary/40 opacity-0 group-hover:opacity-100 transition-all duration-700 z-10 flex flex-col items-center justify-center backdrop-blur-sm">
                  <span className="text-white font-display text-3xl tracking-widest uppercase mb-2 scale-90 group-hover:scale-100 transition-transform duration-500">La Magie de Pedri</span>
                  <div className="flex gap-4">
                    <span className="bg-white/20 backdrop-blur-md px-4 py-1 rounded-full text-[0.6rem] uppercase tracking-widest border border-white/30">Vision</span>
                    <span className="bg-white/20 backdrop-blur-md px-4 py-1 rounded-full text-[0.6rem] uppercase tracking-widest border border-white/30">Talent</span>
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
                <div className="p-6 relative z-20">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-1 bg-blue-primary rounded-full" />
                    <h3 className="text-2xl font-display">Més que un Club</h3>
                    <div className="w-10 h-1 bg-red-primary rounded-full" />
                  </div>
                  <p className="text-muted-text leading-relaxed mb-6 text-base">
                    Pour Salma, le football est une symphonie menée par des génies comme Pedri. Ta passion pour le Barça reflète ta loyauté inébranlable et ton énergie débordante.
                  </p>
                  <div className="flex gap-4">
                    <button className="bg-blue-primary/90 backdrop-blur-md px-6 py-2 rounded-full text-[0.65rem] uppercase tracking-[0.2em] font-bold border border-white/10 hover:bg-blue-primary transition-all hover:scale-105">Visca Barça</button>
                    <button className="bg-red-primary/90 backdrop-blur-md px-6 py-2 rounded-full text-[0.65rem] uppercase tracking-[0.2em] font-bold border border-white/10 hover:bg-red-primary transition-all hover:scale-105">Força Barça</button>
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
                <div className="p-3 glass-gold rounded-2xl">
                  <Mic2 className="text-gold" size={24} />
                </div>
                <div className="h-px flex-1 bg-gold/20" />
                <span className="text-gold-light text-[0.6rem] tracking-[0.4em] uppercase font-bold">Chapitre III</span>
              </div>
              
              <h2 className="font-display text-4xl md:text-6xl mb-6 leading-tight">L'Âme d'Artiste</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="h-full max-h-[350px]">
                  <MemoryAgenda user={user} />
                </div>
                <div className="glass p-6 rounded-[2rem] border-gold/10 flex flex-col items-center text-center overflow-hidden hover:border-gold/40 transition-all hover:bg-white/10 group shadow-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gold/10 rounded-lg">
                      <Music className="text-gold group-hover:rotate-12 transition-transform" size={18} />
                    </div>
                    <h4 className="text-[0.7rem] font-bold uppercase tracking-[0.3em] text-gold-light">Ta Mélodie</h4>
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
                  <p className="text-xs text-muted-text mt-4 italic font-light leading-relaxed px-4">
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
                y: [0, -10, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="text-8xl mb-8 drop-shadow-[0_0_30px_rgba(212,175,55,0.4)]"
            >
              🎁
            </motion.div>
            
            <h2 className="font-display text-4xl md:text-6xl mb-6 text-center text-glow">Pour Toi, Salma</h2>
            <p className="text-muted-text text-center max-w-lg mb-10 leading-relaxed text-base italic">
              "Ce voyage à travers tes passions n'est que le prélude d'une symphonie infinie. Quelqu'un a voulu que tu saches à quel point ton existence illumine ce monde."
            </p>
            
            <div className="flex flex-col gap-4 w-full max-w-sm">
              <motion.button 
                whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(212,175,55,0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setChapter('chat');
                }}
                className="bg-gradient-to-r from-gold via-gold-light to-gold py-5 rounded-full text-[0.75rem] tracking-[0.4em] uppercase font-bold text-bg shadow-2xl transition-all"
              >
                Parler à Lumière
              </motion.button>
              <button 
                onClick={() => setChapter('cover')}
                className="text-muted-text text-[0.65rem] uppercase tracking-[0.3em] hover:text-gold-light transition-all font-bold"
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
            className="flex-1 flex flex-col z-10 h-[100dvh] overflow-hidden"
          >
            <header className="bg-bg/60 backdrop-blur-2xl border-b border-gold/10 p-4 pr-24 flex items-center justify-between sticky top-0 z-50">
              <div className="flex items-center gap-4">
                <motion.button 
                  whileHover={{ x: -5 }}
                  onClick={() => setChapter('gift')} 
                  className="text-gold-light p-2 hover:bg-gold/10 rounded-full transition-all"
                >
                  <ChevronLeft size={24} />
                </motion.button>
                <div className="flex items-center gap-4">
                  <motion.div 
                    animate={{ 
                      y: [0, -3, 0],
                      rotate: [0, 3, -3, 0],
                      scale: [1, 1.02, 1]
                    }}
                    transition={{ 
                      duration: 8,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="relative group"
                  >
                    <div className="absolute -inset-1.5 bg-gradient-to-br from-gold via-gold-light to-gold rounded-2xl blur-md opacity-40 group-hover:opacity-70 transition-opacity animate-pulse" />
                    <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-gold via-gold-light to-gold flex items-center justify-center text-2xl shadow-2xl border border-white/20 overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.4),transparent)]" />
                      <span className="relative z-10 drop-shadow-md">✨</span>
                    </div>
                  </motion.div>
                  <div>
                    <div className="text-gold-light text-[0.6rem] tracking-[0.5em] uppercase font-black mb-1 opacity-80">Esprit Protecteur</div>
                    <div className="font-display text-2xl text-glow leading-none">Lumière</div>
                  </div>
                </div>
              </div>
              
              {!user && (
                <div className="flex flex-col items-end gap-2 mr-16">
                  <button 
                    onClick={handleLogin}
                    disabled={isLoggingIn}
                    className={`text-[0.65rem] uppercase tracking-[0.2em] bg-gold/10 border border-gold/20 px-6 py-2.5 rounded-full text-gold-light hover:bg-gold hover:text-bg transition-all font-bold ${isLoggingIn ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isLoggingIn ? 'Connexion...' : 'Connexion'}
                  </button>
                  {loginError && (
                    <motion.span 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[0.55rem] text-red-400 uppercase tracking-widest font-bold"
                    >
                      {loginError}
                    </motion.span>
                  )}
                </div>
              )}
              {user && (
                <div className="flex items-center gap-3 glass-gold px-4 py-2 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[0.6rem] uppercase tracking-widest font-bold text-gold-light">{user.displayName?.split(' ')[0]}</span>
                </div>
              )}
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar scroll-smooth">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ 
                    duration: 0.7, 
                    ease: [0.22, 1, 0.36, 1],
                    delay: msg.role === 'model' ? 0.2 : 0
                  }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start items-start'}`}
                >
                  {msg.role === 'model' && (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 flex items-center justify-center text-gold mr-4 mt-1 flex-shrink-0 shadow-lg shadow-gold/5">
                      <Sparkles size={18} className="animate-pulse" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] p-6 shadow-2xl relative group ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-blue-primary to-blue-primary/80 text-white rounded-3xl rounded-tr-sm border border-white/10'
                        : 'bg-white/5 backdrop-blur-sm border border-gold/10 rounded-3xl rounded-tl-sm'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <div className="flex items-center gap-3 mb-2 opacity-60">
                        <UserIcon size={12} />
                        <span className="text-[0.6rem] uppercase tracking-widest font-bold">Salma</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 mb-3 opacity-80">
                        <span className="text-[0.65rem] uppercase tracking-[0.3em] font-bold text-gold">Lumière</span>
                        <div className="h-px w-8 bg-gold/30" />
                      </div>
                    )}
                    
                    <div className={`markdown-body ${msg.role === 'model' ? 'font-display italic text-white-cream/90' : 'font-sans font-medium'}`}>
                      {msg.role === 'model' ? (
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      ) : (
                        <p>{msg.text}</p>
                      )}
                    </div>

                    {msg.role === 'model' && (
                      <div className="absolute -bottom-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Sparkles size={12} className="text-gold/40" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start items-start"
                >
                  <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-gold mr-4 mt-1 flex-shrink-0">
                    <Sparkles size={18} className="animate-pulse" />
                  </div>
                  <div className="bg-white/5 border border-gold/10 rounded-3xl rounded-tl-sm px-6 py-4 backdrop-blur-sm flex flex-col gap-2">
                    <div className="text-[0.6rem] text-gold/60 uppercase tracking-[0.2em] font-medium italic">Lumière s'imprègne de tes mots...</div>
                    <div className="flex gap-2 py-1">
                      <div className="w-2 h-2 rounded-full bg-gold/60 animate-bounce [animation-duration:0.6s]" />
                      <div className="w-2 h-2 rounded-full bg-gold/60 animate-bounce [animation-duration:0.6s] [animation-delay:0.2s]" />
                      <div className="w-2 h-2 rounded-full bg-gold/60 animate-bounce [animation-duration:0.6s] [animation-delay:0.4s]" />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-bg/95 backdrop-blur-xl border-t border-gold/10 relative z-20">
              <div className="flex gap-4 max-w-4xl mx-auto relative items-center">
                <div className="absolute -inset-1 bg-gradient-to-r from-gold/20 to-blue-primary/20 blur-xl opacity-30 pointer-events-none" />
                
                <div className="relative flex-1 flex items-center">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={isListening ? "Je t'écoute, mon âme sœur..." : "Écris à ton esprit protecteur..."}
                    className="w-full bg-white/5 border border-gold/20 rounded-2xl px-6 py-4 pr-16 text-[0.85rem] outline-none focus:border-gold/50 focus:bg-white/10 transition-all placeholder:text-muted-text/50 shadow-inner"
                  />
                  <div className="absolute right-4 flex items-center gap-2">
                    {isListening && <VoiceWave isListening={isListening} />}
                    <button
                      onClick={toggleListening}
                      className={`p-2 rounded-xl transition-all ${isListening ? 'text-red-primary bg-red-primary/10 animate-pulse' : 'text-gold-light/40 hover:text-gold hover:bg-gold/10'}`}
                    >
                      {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!inputValue.trim() || isLoading}
                  onClick={() => handleSendMessage()}
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold to-gold/80 text-bg flex items-center justify-center disabled:from-gray-800 disabled:to-gray-900 disabled:text-muted-text transition-all shadow-lg shadow-gold/20 group"
                >
                  <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </motion.button>
              </div>
              <div className="text-center mt-2">
                <p className="text-[0.55rem] text-muted-text/40 uppercase tracking-[0.4em]">Inspiré par ta lumière</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
