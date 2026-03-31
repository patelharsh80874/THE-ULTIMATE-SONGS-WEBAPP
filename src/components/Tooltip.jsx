import React from 'react';

const Tooltip = ({ text, children, position = 'top' }) => {
  const isBottom = position === 'bottom';
  
  return (
    <div className="relative inline-flex items-center justify-center group/tooltip">
      {children}
      <div className={`absolute left-1/2 -translate-x-1/2 w-max max-w-[180px] opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-all duration-300 z-[100] text-center
        ${isBottom 
          ? 'top-full mt-2 translate-y-[-4px] group-hover/tooltip:translate-y-0' 
          : 'bottom-full mb-2 translate-y-1 group-hover/tooltip:translate-y-0'
        } bg-slate-800 border border-slate-700 shadow-xl rounded-md px-2 py-1`}>
        <p className="text-white text-[10px] sm:text-[9px] font-bold tracking-wide whitespace-normal leading-tight">{text}</p>
        <div className={`absolute left-1/2 -translate-x-1/2 border-[4px] border-transparent 
          ${isBottom 
            ? 'bottom-full border-b-slate-800' 
            : 'top-full border-t-slate-800'
          }`}></div>
      </div>
    </div>
  );
};

export default Tooltip;
