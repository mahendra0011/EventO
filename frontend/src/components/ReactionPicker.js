import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Heart, Laugh, Frown, ThumbsUp, Sparkles } from 'lucide-react';

const ReactionPicker = ({ onSelect }) => {
  const reactions = [
    { emoji: '\u{1F44D}', icon: ThumbsUp, label: 'Thumbs up' },
    { emoji: '\u2764\uFE0F', icon: Heart, label: 'Heart' },
    { emoji: '\u{1F604}', icon: Smile, label: 'Smile' },
    { emoji: '\u{1F602}', icon: Laugh, label: 'Laugh' },
    { emoji: '\u{1F62E}', icon: Sparkles, label: 'Wow' },
    { emoji: '\u{1F622}', icon: Frown, label: 'Sad' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 10 }}
        className="relative z-10 rounded-lg border border-cocoa-100 bg-white p-2 shadow-xl shadow-cocoa-900/10"
      >
        <div className="flex items-center gap-1">
          {reactions.map((reaction) => (
            <button
              key={reaction.emoji}
              type="button"
              onClick={() => onSelect(reaction.emoji)}
              className="rounded-lg p-2 text-xl transition-colors hover:bg-primary-50"
              title={reaction.label}
            >
              {reaction.emoji}
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReactionPicker;
