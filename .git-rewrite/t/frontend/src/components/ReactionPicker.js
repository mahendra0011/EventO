import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Heart, Laugh, Frown, ThumbsUp, Sparkles, X } from 'lucide-react';

const ReactionPicker = ({ onSelect, onClose }) => {
  const reactions = [
    { emoji: '👍', icon: ThumbsUp, label: 'Thumbs up' },
    { emoji: '❤️', icon: Heart, label: 'Heart' },
    { emoji: '😄', icon: Smile, label: 'Smile' },
    { emoji: '😂', icon: Laugh, label: 'Laugh' },
    { emoji: '😮', icon: Sparkles, label: 'Wow' },
    { emoji: '😢', icon: Frown, label: 'Sad' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 10 }}
        className='absolute bottom-full right-0 mb-2 p-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-10'
      >
        <div className='flex items-center gap-1'>
          {reactions.map((r) => (
            <button
              key={r.emoji}
              onClick={() => onSelect(r.emoji)}
              className='p-2 hover:bg-slate-700 rounded-lg transition-colors text-xl'
              title={r.label}
            >
              {r.emoji}
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReactionPicker;
