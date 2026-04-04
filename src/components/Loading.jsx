import React, { useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const Loading = ({ page, customText }) => {
  useEffect(() => {
    if (!customText && !page) {
      toast.success(`Searching tracks...`, {
        duration: 2000,
        icon: '🎵',
        style: {
          borderRadius: '12px',
          background: 'rgba(30, 41, 59, 0.95)',
          color: '#22c55e',
          border: '1px solid rgba(34, 197, 94, 0.1)',
          backdropFilter: 'blur(8px)',
          fontWeight: '700',
          fontSize: '13px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)'
        },
      });
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[100] w-full h-screen flex flex-col items-center justify-center bg-slate-900">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-slate-900">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-green-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      </div>
      
      <div className="relative flex flex-col items-center gap-10">
        
        {/* Modern Equalizer Animation */}
        <div className="flex items-end justify-center gap-1.5 h-20 w-32 translate-y-4">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                height: [
                  "20%", 
                  `${Math.random() * 80 + 20}%`, 
                  `${Math.random() * 80 + 20}%`, 
                  "20%"
                ],
                backgroundColor: ["#22c55e", "#4ade80", "#22c55e"]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 0.8 + Math.random() * 0.4, 
                ease: "easeInOut",
                delay: i * 0.05
              }}
              className="w-2.5 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.3)]"
            />
          ))}
        </div>

        {/* Brand/Loading Text */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="text-white font-black tracking-[0.4em] uppercase text-xs"
            >
              {customText || "The Ultimate Songs"}
            </motion.h2>
            <motion.div 
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -inset-4 bg-green-500/10 blur-xl rounded-full"
            />
          </div>

          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-2">
            Optimizing Audio Stream
            <span className="flex gap-1">
               <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className="w-1 h-1 bg-green-500 rounded-full" />
               <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-1 h-1 bg-green-500 rounded-full" />
               <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-1 h-1 bg-green-500 rounded-full" />
            </span>
          </p>
        </div>
      </div>

      {/* Modern Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950 opacity-40 pointer-events-none"></div>
    </div>
  );
};

export default Loading;

