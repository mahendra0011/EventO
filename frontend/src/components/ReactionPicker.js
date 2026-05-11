import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Heart, Laugh, Frown, ThumbsUp, Sparkles } from 'lucide-react';

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
        className='absolute bottom-full right-0 z-10 mb-2 rounded-lg border border-cocoa-100 bg-white p-2 shadow-xl shadow-cocoa-900/10'
      >
        <div className='flex items-center gap-1'>
          {reactions.map((r) => (
            <button
              key={r.emoji}
              onClick={() => onSelect(r.emoji)}
              className='rounded-lg p-2 text-xl transition-colors hover:bg-primary-50'
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
