import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface LumiereSpiritProps {
  state: 'idle' | 'thinking' | 'speaking';
}

export const LumiereSpirit: React.FC<LumiereSpiritProps> = ({ state }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const [orbitAngle, setOrbitAngle] = React.useState(0);
  const trailRef = useRef<{ x: number, y: number, opacity: number }[]>([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 60,
        y: (e.clientY / window.innerHeight - 0.5) * 60
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    
    let frameId: number;
    const animateOrbit = () => {
      setOrbitAngle(prev => (prev + 0.004) % (Math.PI * 2));
      frameId = requestAnimationFrame(animateOrbit);
    };
    frameId = requestAnimationFrame(animateOrbit);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(frameId);
    };
  }, []);

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

  // Calculate orbital position - Closer to the chat box
  const radiusX = typeof window !== 'undefined' ? Math.min(window.innerWidth * 0.42, 600) : 500;
  const radiusY = typeof window !== 'undefined' ? Math.min(window.innerHeight * 0.38, 450) : 350;
  
  // Primary Spirit Path
  const time = Date.now() / 1000;
  const orbitX = Math.cos(orbitAngle) * radiusX + Math.sin(time * 0.4) * 40;
  const orbitY = Math.sin(orbitAngle) * radiusY + Math.cos(time * 0.6) * 50;
  
  // Companion Spirit Path (Offset and different speed)
  const companionAngle = orbitAngle + Math.PI * 0.8;
  const compX = Math.cos(companionAngle) * (radiusX * 0.7) + Math.sin(time * 0.8) * 20;
  const compY = Math.sin(companionAngle) * (radiusY * 0.7) + Math.cos(time * 0.9) * 25;
  
  const depthFactor = (Math.sin(orbitAngle) + 1) / 2;
  const depthScale = 0.8 + depthFactor * 0.4;
  const depthOpacity = 0.5 + depthFactor * 0.5;

  const compDepthFactor = (Math.sin(companionAngle) + 1) / 2;
  const compScale = (0.4 + compDepthFactor * 0.3) * (state === 'thinking' ? 1.2 : 1);
  const compOpacity = 0.2 + compDepthFactor * 0.4;

  // Eye tracking logic
  const eyeX = (mousePos.x / 60) * 8;
  const eyeY = (mousePos.y / 60) * 8;

  return (
    <div className="relative w-full h-full overflow-hidden bg-transparent flex items-center justify-center">
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
          y: orbitY + mousePos.y + Math.sin(Date.now() / 1000) * 20,
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

        {/* Main Body */}
        <div className="relative w-44 h-44 bg-gradient-to-br from-gold-light via-gold/80 to-gold-deep/60 rounded-full shadow-[0_0_120px_rgba(212,175,55,0.5)] flex items-center justify-center overflow-hidden border border-white/30 backdrop-blur-lg">
          {/* Internal Glow Swirls */}
          <motion.div 
            animate={{ rotate: 360, opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent,rgba(255,255,255,0.2),transparent)]"
          />

          {/* Blush */}
          <motion.div 
            animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute bottom-14 left-8 w-10 h-5 bg-red-primary/25 blur-md rounded-full" 
          />
          <motion.div 
            animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }}
            transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
            className="absolute bottom-14 right-8 w-10 h-5 bg-red-primary/25 blur-md rounded-full" 
          />

          {/* Eyes with Tracking */}
          <div className="flex gap-12 relative z-10">
            <motion.div 
              animate={state === 'thinking' ? { 
                x: eyeX + Math.sin(Date.now() / 200) * 2, 
                y: eyeY + Math.cos(Date.now() / 200) * 2,
                scaleY: [1, 0.1, 1] 
              } : {
                x: eyeX,
                y: eyeY,
                scaleY: [1, 1, 0.1, 1, 1],
              }}
              transition={{ 
                duration: state === 'thinking' ? 0.5 : 4.5, 
                repeat: Infinity,
                times: state === 'thinking' ? [0, 0.5, 1] : [0, 0.9, 0.95, 1]
              }}
              className="w-7 h-7 bg-bg rounded-full shadow-inner relative flex items-center justify-center"
            >
              <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 bg-white rounded-full opacity-90" />
              <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 bg-white rounded-full opacity-50" />
            </motion.div>
            <motion.div 
              animate={state === 'thinking' ? { 
                x: eyeX + Math.sin(Date.now() / 200) * 2, 
                y: eyeY + Math.cos(Date.now() / 200) * 2,
                scaleY: [1, 0.1, 1] 
              } : {
                x: eyeX,
                y: eyeY,
                scaleY: [1, 1, 0.1, 1, 1],
              }}
              transition={{ 
                duration: state === 'thinking' ? 0.5 : 4.5, 
                repeat: Infinity,
                delay: 0.15,
                times: state === 'thinking' ? [0, 0.9, 0.95, 1] : [0, 0.9, 0.95, 1]
              }}
              className="w-7 h-7 bg-bg rounded-full shadow-inner relative flex items-center justify-center"
            >
              <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 bg-white rounded-full opacity-90" />
              <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 bg-white rounded-full opacity-50" />
            </motion.div>
          </div>
          
          {/* Mouth/Speaking indicator */}
          <div className="absolute bottom-12 h-4 flex items-center justify-center">
            {state === 'speaking' ? (
              <motion.div
                animate={{ 
                  scaleX: [1, 1.5, 1], 
                  scaleY: [1, 0.5, 1],
                  opacity: [0.6, 1, 0.6]
                }}
                transition={{ duration: 0.25, repeat: Infinity }}
                className="w-6 h-2 bg-bg/40 rounded-full blur-[1px]"
              />
            ) : (
              <motion.div 
                animate={{ width: [12, 16, 12] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-4 h-[2px] bg-bg/30 rounded-full" 
              />
            )}
          </div>
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
