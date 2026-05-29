import React, { useState } from 'react';

interface TawaButtonProps {
  onTawa: () => void;
  disabled: boolean;
}

export const TawaButton: React.FC<TawaButtonProps> = ({ onTawa, disabled }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [animating, setAnimating] = useState(false);

  const handleClick = () => {
    if (disabled) return;

    if (!showConfirm) {
      setShowConfirm(true);
      setTimeout(() => setShowConfirm(false), 3000);
      return;
    }

    setShowConfirm(false);
    setAnimating(true);
    setTimeout(() => {
      setAnimating(false);
      onTawa();
    }, 400);
  };

  return (
    <div className="relative flex flex-col items-center">
      <button
        className={`
          relative overflow-hidden rounded-2xl font-black text-xl tracking-widest
          transition-all duration-300 select-none
          ${disabled
            ? 'px-8 py-3 bg-gray-700/50 text-gray-500 cursor-not-allowed border-2 border-gray-600/30'
            : showConfirm
              ? 'px-10 py-4 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 text-white border-2 border-yellow-300 shadow-2xl shadow-orange-500/50 scale-110 animate-pulse cursor-pointer'
              : animating
                ? 'px-8 py-3 bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 text-white border-2 border-orange-400/50 scale-125 cursor-pointer'
                : 'px-8 py-3 bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 text-white border-2 border-orange-400/50 hover:scale-110 hover:shadow-xl hover:shadow-red-500/40 active:scale-95 cursor-pointer'
          }
        `}
        onClick={handleClick}
      >
        <span className="relative z-10 flex items-center gap-2">
          {showConfirm ? '⚡ CONFIRM TAWA! ⚡' : '🔥 TAWA! 🔥'}
        </span>
      </button>

      {!disabled && !showConfirm && (
        <p className="text-center text-[10px] text-orange-300/50 mt-1">
          Click when you think you win
        </p>
      )}

      {showConfirm && (
        <p className="text-center text-[10px] text-yellow-300 mt-1 font-bold animate-pulse">
          Are you sure? Click again to confirm!
        </p>
      )}
    </div>
  );
};
