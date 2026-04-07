import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { sounds } from '../lib/sounds';

interface LumiereSpiritProps {
  state: 'idle' | 'thinking' | 'speaking';
  isInputFocused?: boolean;
}

export const LumiereSpirit: React.FC<LumiereSpiritProps> = ({ state, isInputFocused }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const [eyeTarget, setEyeTarget] = React.useState({ x: 0, y: 0 });
  const [saccade, setSaccade] = React.useState({ x: 0, y: 0 });
  const [orbitAngle, setOrbitAngle] = React.useState(0);
  const [blinkState, setBlinkState] = React.useState(1); // 1 = open, 0 = closed

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 60,
        y: (e.clientY / window.innerHeight - 0.5) * 60
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    
    // Saccades: Small rapid eye movements to look alive
    const saccadeInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setSaccade({
          x: (Math.random() - 0.5) * 4,
          y: (Math.random() - 0.5) * 4
        });
        // Reset saccade quickly
        setTimeout(() => setSaccade({ x: 0, y: 0 }), 150);
      }
    }, 2000);

    // Natural Blinking
    const blinkInterval = setInterval(() => {
      if (Math.random() > 0.6) {
        setBlinkState(0);
        sounds.playBlink();
        setTimeout(() => setBlinkState(1), 120);
        // Occasional double blink
        if (Math.random() > 0.8) {
          setTimeout(() => {
            setBlinkState(0);
            setTimeout(() => setBlinkState(1), 100);
          }, 250);
        }
      }
    }, 4000);

    let frameId: number;
    const animateOrbit = () => {
      setOrbitAngle(prev => (prev + 0.004) % (Math.PI * 2));
      frameId = requestAnimationFrame(animateOrbit);
    };
    frameId = requestAnimationFrame(animateOrbit);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(saccadeInterval);
      clearInterval(blinkInterval);
      cancelAnimationFrame(frameId);
    };
  }, []);

  // Eye target calculation
  useEffect(() => {
    let targetX = (mousePos.x / 60) * 8;
    let targetY = (mousePos.y / 60) * 8;

    // If input is focused, look down towards the chat input
    if (isInputFocused) {
      targetX = 0;
      targetY = 10; // Looking down
    }

    // Thinking state: eyes dart around more
    if (state === 'thinking') {
      targetX += Math.sin(Date.now() / 150) * 5;
      targetY += Math.cos(Date.now() / 150) * 5;
    }

    setEyeTarget({ x: targetX + saccade.x, y: targetY + saccade.y });
  }, [mousePos, isInputFocused, state, saccade]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width: number, height: number;
    let particles: Particle[] = [];

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      width = canvas.width = parent.clientWidth;
      height = canvas.height = parent.clientHeight;
    };

    class Particle {
      x: number = 0;
      y: number = 0;
      vx: number = 0;
      vy: number = 0;
      sz: number = 0;
      a: number = 0;
      ma: number = 0;
      lf: number = 0;
      ml: number = 0;
      h: number = 0;

      constructor(initial = false) {
        this.reset(initial);
      }

      reset(initial = false) {
        this.x = Math.random() * width;
        this.y = initial ? Math.random() * height : height + 20;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = -(0.1 + Math.random() * 0.6);
        this.sz = 0.5 + Math.random() * 2;
        this.a = 0;
        this.ma = 0.05 + Math.random() * 0.3;
        this.lf = 0;
        this.ml = 400 + Math.random() * 500;
        this.h = 35 + Math.random() * 25;
      }

      update() {
        this.lf++;
        this.x += this.vx + Math.sin(this.lf * 0.015) * 0.25;
        this.y += this.vy;
        const t = this.lf / this.ml;
        this.a = t < 0.2 ? this.ma * (t / 0.2) : t > 0.8 ? this.ma * (1 - (t - 0.8) / 0.2) : this.ma;
        if (this.lf >= this.ml || this.y < -20) this.reset();
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.globalAlpha = this.a;
        ctx.fillStyle = `hsl(${this.h}, 80%, 65%)`;
        ctx.shadowBlur = 15;
        ctx.shadowColor = `hsl(${this.h}, 80%, 65%)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.sz, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    const init = () => {
      resize();
      particles = [];
      for (let i = 0; i < 150; i++) particles.push(new Particle(true));
    };

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      animationId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    init();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Calculate orbital position - Responsive radii
  const [windowSize, setWindowSize] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (state === 'speaking') {
      sounds.playMagicChime();
    }
  }, [state]);

  const isMobile = windowSize.width < 768;
  const radiusX = isMobile ? windowSize.width * 0.3 : Math.min(windowSize.width * 0.42, 600);
  const radiusY = isMobile ? windowSize.height * 0.25 : Math.min(windowSize.height * 0.38, 450);
  
  // Primary Spirit Path
  const time = Date.now() / 1000;
  const orbitX = Math.cos(orbitAngle) * radiusX + Math.sin(time * 0.4) * (isMobile ? 20 : 40);
  const orbitY = Math.sin(orbitAngle) * radiusY + Math.cos(time * 0.6) * (isMobile ? 25 : 50);
  
  // Excited floating for the main spirit
  const excitedFloat = Math.sin(Date.now() / 400) * (isMobile ? 10 : 20);
  
  // Companion Spirit Path (Offset and different speed)
  const companionAngle = orbitAngle + Math.PI * 0.8;
  const compX = Math.cos(companionAngle) * (radiusX * 0.7) + Math.sin(time * 0.8) * (isMobile ? 10 : 20);
  const compY = Math.sin(companionAngle) * (radiusY * 0.7) + Math.cos(time * 0.9) * (isMobile ? 12 : 25);
  
  const depthFactor = (Math.sin(orbitAngle) + 1) / 2;
  const depthScale = (isMobile ? 0.6 : 0.8) + depthFactor * (isMobile ? 0.2 : 0.4);
  const depthOpacity = 0.5 + depthFactor * 0.5;

  const compDepthFactor = (Math.sin(companionAngle) + 1) / 2;
  const compScale = (0.4 + compDepthFactor * 0.3) * (state === 'thinking' ? 1.2 : 1);
  const compOpacity = 0.2 + compDepthFactor * 0.4;

  return (
    <div className="relative w-full h-full overflow-hidden bg-transparent flex items-center justify-center">
      {/* Birthday Celebration Sparkles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
              y: [-20, -150],
              x: (i - 6) * 60
            }}
            transition={{ 
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
            className="absolute left-1/2 bottom-1/2 text-gold/40 text-2xl"
          >
            ✦
          </motion.div>
        ))}
      </div>

      {/* Deep Background Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.12)_0%,transparent_80%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(212,175,55,0.06)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(212,175,55,0.06)_0%,transparent_60%)]" />
      
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-60" />
      
      {/* Companion Spirit (Smaller, trailing) */}
      <motion.div
        animate={{
          x: compX + mousePos.x * 0.5,
          y: compY + mousePos.y * 0.5,
          scale: compScale,
          opacity: compOpacity,
        }}
        transition={{
          x: { type: "spring", stiffness: 30, damping: 30 },
          y: { type: "spring", stiffness: 30, damping: 30 },
        }}
        className="absolute z-15 pointer-events-none"
      >
        <div className="w-12 h-12 bg-gold/40 rounded-full blur-xl animate-pulse" />
        <div className="absolute inset-0 w-6 h-6 m-auto bg-white/40 rounded-full blur-sm" />
      </motion.div>

      {/* Lumiere Core */}
      <motion.div
        animate={{
          x: orbitX + mousePos.x,
          y: orbitY + mousePos.y + excitedFloat,
          scale: (state === 'thinking' ? 1.15 : 1) * depthScale,
          opacity: depthOpacity,
        }}
        transition={{
          x: { type: "spring", stiffness: 40, damping: 25 },
          y: { type: "spring", stiffness: 40, damping: 25 },
          scale: { duration: 0.6, ease: "easeInOut" },
          opacity: { duration: 0.6 }
        }}
        className="relative z-20 flex flex-col items-center"
      >
        {/* Multi-layered Aura */}
        <div className="absolute inset-0 bg-gold/15 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute inset-0 bg-gold-pale/10 rounded-full blur-[60px] scale-150 animate-pulse delay-700" />
        
        {/* Floating Rings */}
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ rotate: { duration: 25, repeat: Infinity, ease: "linear" }, scale: { duration: 4, repeat: Infinity, ease: "easeInOut" } }}
          className="absolute -inset-20 border border-gold/10 rounded-full"
          style={{ borderRadius: '45% 55% 55% 45% / 45% 45% 55% 55%' }}
        />
        <motion.div
          animate={{ rotate: -360, scale: [1.1, 1, 1.1] }}
          transition={{ rotate: { duration: 35, repeat: Infinity, ease: "linear" }, scale: { duration: 5, repeat: Infinity, ease: "easeInOut" } }}
          className="absolute -inset-24 border border-gold-pale/5 rounded-full"
          style={{ borderRadius: '55% 45% 45% 55% / 55% 55% 45% 45%' }}
        />

        {/* Birthday Hat */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: isMobile ? -50 : -70, opacity: 1, scale: isMobile ? 0.7 : 1 }}
          className="absolute z-30 flex flex-col items-center pointer-events-none"
        >
          {/* Pom-pom */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full shadow-[0_0_15px_white] mb-[-6px] relative z-10" 
          />
          {/* Cone */}
          <div 
            className="w-10 h-14 sm:w-14 sm:h-20 bg-gradient-to-b from-gold-light via-gold to-gold-deep shadow-xl"
            style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
          />
        </motion.div>

        {/* Main Body */}
        <div className={`relative ${isMobile ? 'w-28 h-28' : 'w-44 h-44'} bg-gradient-to-br from-gold-light via-gold/80 to-gold-deep/60 rounded-full shadow-[0_0_120px_rgba(212,175,55,0.5)] flex items-center justify-center overflow-hidden border border-white/30 backdrop-blur-lg`}>
          {/* Internal Glow Swirls */}
          <motion.div 
            animate={{ rotate: 360, opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent,rgba(255,255,255,0.2),transparent)]"
          />

          {/* Blush - More vibrant for excitement */}
          <motion.div 
            animate={{ 
              opacity: [0.4, 0.7, 0.4], 
              scale: [1, 1.2, 1],
              backgroundColor: ["rgba(165, 0, 68, 0.3)", "rgba(165, 0, 68, 0.5)", "rgba(165, 0, 68, 0.3)"]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-14 left-8 w-12 h-6 blur-md rounded-full" 
          />
          <motion.div 
            animate={{ 
              opacity: [0.4, 0.7, 0.4], 
              scale: [1, 1.2, 1],
              backgroundColor: ["rgba(165, 0, 68, 0.3)", "rgba(165, 0, 68, 0.5)", "rgba(165, 0, 68, 0.3)"]
            }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            className="absolute bottom-14 right-8 w-12 h-6 blur-md rounded-full" 
          />

          {/* Eyes with Tracking */}
          <div className="flex gap-8 sm:gap-12 relative z-10">
            <motion.div 
              animate={{ 
                x: eyeTarget.x * (isMobile ? 0.6 : 1),
                y: eyeTarget.y * (isMobile ? 0.6 : 1),
                scaleY: blinkState,
                scale: state === 'speaking' ? [1, 1.1, 1] : 1
              }}
              transition={{ 
                x: { type: "spring", stiffness: 200, damping: 12 },
                y: { type: "spring", stiffness: 200, damping: 12 },
                scaleY: { duration: 0.1 },
                scale: { duration: 0.2, repeat: state === 'speaking' ? Infinity : 0 }
              }}
              className="w-6 h-6 sm:w-8 sm:h-8 bg-bg rounded-full shadow-inner relative flex items-center justify-center border border-gold/20"
            >
              <div className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full opacity-95 shadow-[0_0_8px_white]" />
              <div className="absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full opacity-60" />
              {/* Joyful squint when excited */}
              <motion.div 
                animate={{ opacity: state === 'speaking' ? 0.4 : 0 }}
                className="absolute inset-0 bg-gold/20 rounded-full"
              />
            </motion.div>
            <motion.div 
              animate={{ 
                x: eyeTarget.x * (isMobile ? 0.6 : 1),
                y: eyeTarget.y * (isMobile ? 0.6 : 1),
                scaleY: blinkState,
                scale: state === 'speaking' ? [1, 1.1, 1] : 1
              }}
              transition={{ 
                x: { type: "spring", stiffness: 200, damping: 12 },
                y: { type: "spring", stiffness: 200, damping: 12 },
                scaleY: { duration: 0.1 },
                scale: { duration: 0.2, repeat: state === 'speaking' ? Infinity : 0 }
              }}
              className="w-6 h-6 sm:w-8 sm:h-8 bg-bg rounded-full shadow-inner relative flex items-center justify-center border border-gold/20"
            >
              <div className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full opacity-95 shadow-[0_0_8px_white]" />
              <div className="absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full opacity-60" />
              <motion.div 
                animate={{ opacity: state === 'speaking' ? 0.4 : 0 }}
                className="absolute inset-0 bg-gold/20 rounded-full"
              />
            </motion.div>
          </div>
          
          {/* Joyful Smile */}
          <div className="absolute bottom-6 sm:bottom-10 h-6 sm:h-8 flex items-center justify-center">
            <motion.div
              animate={{ 
                height: state === 'speaking' ? [6, 12, 6] : 8,
                width: state === 'speaking' ? [20, 28, 20] : 24,
                rotate: [0, 2, -2, 0]
              }}
              transition={{ 
                duration: state === 'speaking' ? 0.2 : 3, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="border-b-4 border-bg/70 rounded-[0_0_50%_50%] shadow-[0_4px_10px_rgba(0,0,0,0.2)]"
            />
            {/* Party Blower */}
            <motion.div
              animate={{ 
                scaleX: state === 'speaking' ? [1, 1.5, 1] : 1,
                rotate: [15, 20, 15]
              }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="absolute -right-3 sm:-right-4 bottom-0 w-6 h-1.5 sm:w-8 sm:h-2 bg-red-primary rounded-full origin-left"
            />
          </div>
        </div>

        {/* Small Hands */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Left Hand holding a balloon */}
          <motion.div
            animate={{ 
              x: (isMobile ? -60 : -110) + Math.sin(Date.now() / 500) * (isMobile ? 6 : 12),
              y: (isMobile ? 15 : 30) + Math.cos(Date.now() / 700) * (isMobile ? 9 : 18),
              rotate: [-15, 15, -15]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-0 top-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-gold/40 rounded-[40%_60%_60%_40%] blur-sm border border-white/20 flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.3)]"
          >
            <div className="w-4 h-4 sm:w-5 sm:h-5 bg-white/30 rounded-full" />
            {/* Tiny finger-like glow */}
            <div className="absolute -top-1 left-1.5 sm:left-2 w-1.5 h-3 sm:w-2 sm:h-4 bg-gold/30 rounded-full rotate-[-20deg]" />
            
            {/* Balloon String */}
            <div className="absolute bottom-full left-1/2 w-[1px] h-12 sm:h-20 bg-white/20 origin-bottom" />
            {/* Balloon */}
            <motion.div
              animate={{ y: [-60, -70, -60], rotate: [-5, 5, -5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-[80px] sm:bottom-[120px] left-[-5px] sm:left-[-10px] w-12 h-16 sm:w-16 sm:h-20 bg-gradient-to-br from-gold to-gold-deep rounded-[50%_50%_50%_50%/60%_60%_40%_40%] flex items-center justify-center border border-white/20 shadow-2xl"
            >
              <span className="text-bg font-bold text-base sm:text-xl">25</span>
            </motion.div>
          </motion.div>
          {/* Right Hand holding a cake */}
          <motion.div
            animate={{ 
              x: (isMobile ? 60 : 110) + Math.cos(Date.now() / 500) * (isMobile ? 6 : 12),
              y: (isMobile ? 15 : 30) + Math.sin(Date.now() / 700) * (isMobile ? 9 : 18),
              rotate: [15, -15, 15]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute right-0 top-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-gold/40 rounded-[60%_40%_40%_60%] blur-sm border border-white/20 flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.3)]"
          >
            <div className="w-4 h-4 sm:w-5 sm:h-5 bg-white/30 rounded-full" />
            {/* Tiny finger-like glow */}
            <div className="absolute -top-1 right-1.5 sm:right-2 w-1.5 h-3 sm:w-2 sm:h-4 bg-gold/30 rounded-full rotate-[20deg]" />
            
            {/* Small Cake */}
            <motion.div
              animate={{ y: [-10, -15, -10] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-full mb-1.5 w-10 h-8 sm:w-12 sm:h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg flex flex-col items-center justify-end p-1"
            >
              <div className="w-full h-1/2 bg-gold/30 rounded-t-sm" />
              <div className="w-full h-1/2 bg-gold/20 rounded-b-sm" />
              {/* Candle */}
              <div className="absolute -top-3 sm:-top-4 w-0.5 sm:w-1 h-3 sm:h-4 bg-white/50 rounded-full">
                <motion.div 
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="absolute -top-1.5 sm:-top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gold rounded-full blur-[2px]" 
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Name Label with floating effect */}
        <motion.div 
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="mt-12 px-8 py-2 rounded-full bg-gold/10 border border-gold/20 backdrop-blur-md shadow-xl"
        >
          <span className="text-[12px] tracking-[6px] uppercase text-gold-pale font-cinzel font-bold drop-shadow-lg">Lumière</span>
        </motion.div>
      </motion.div>
    </div>
  );
};
