import React from 'react';
import { motion } from 'framer-motion';
import { Circ } from 'gsap/all';

export default function HorizontalRadioList({ radios, onRadioPress, loading = false }) {
  if (loading) {
    return (
      <div className="flex gap-4 sm:gap-3 overflow-x-auto pb-6 pt-2 px-2 scrollbar-hide snap-x">
        {[...Array(5)].map((_, i) => (
           <div key={i} className="group w-[160px] sm:w-[130px] flex-shrink-0 bg-slate-700/30 p-3 sm:p-2.5 rounded-xl border border-transparent flex flex-col animate-pulse">
             <div className="w-full aspect-square rounded-md bg-slate-800 mb-3" />
             <div className="w-3/4 h-4 bg-slate-800 rounded mb-2" />
             <div className="w-1/2 h-3 bg-slate-800 rounded" />
           </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 sm:gap-3 overflow-x-auto pb-6 pt-2 px-2 scrollbar-hide snap-x">
      {radios.map((radio, idx) => {
        // Critical Fix: Artist stations require the 'name' as the query API parameter
        const internalId = radio.name || radio.title || radio.id || radio.stationid || radio.artistid;
        const name = radio.title || radio.name;
        const image = radio.image || radio.logo || radio.cover;
        const language = radio.more_info?.language || radio?.language || 'hindi';

        if (!internalId) return null;

        return (
          <div key={`${internalId}-${idx}`} className="snap-start">
            <motion.div
              initial={{ y: -100, scale: 0.5 }}
              whileInView={{ y: 0, scale: 1 }}
              transition={{ ease: Circ.easeIn, duration: 0.05 }}
              onClick={() => onRadioPress(language, internalId)}
              className="group w-[160px] sm:w-[130px] flex-shrink-0 bg-slate-700/30 hover:bg-slate-700/70 p-3 sm:p-2.5 rounded-xl cursor-pointer transition-all duration-300 border border-transparent hover:border-slate-500/30 flex flex-col"
            >
              <div className="relative w-full aspect-square rounded-md overflow-hidden mb-3 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                <img
                  src={image}
                  alt={name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Radio'; }}
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <button className="w-12 h-12 rounded-full bg-green-500 text-black flex items-center justify-center shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 hover:bg-green-400">
                    <i className="ri-play-fill text-2xl ml-1"></i>
                  </button>
                </div>
              </div>
              <div className="min-w-0 flex flex-col flex-1">
                <h3 className="text-sm sm:text-xs font-bold text-white truncate mb-1">{name}</h3>
                <h4 className="text-xs sm:text-[10px] text-zinc-400 truncate">Radio Station</h4>
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
