import React from 'react';
import { motion } from 'framer-motion';

const GradientText = ({ 
  children, 
  className = '',
  gradient = 'from-primary-600 via-secondary-600 to-primary-600',
  animate = true,
  ...props 
}) => {
  return (
    <motion.span
      className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent ${
        animate ? 'animate-gradient' : ''
      } ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={animate ? {
        backgroundSize: '200% 200%',
        animation: 'gradient 3s ease infinite',
      } : {}}
      {...props}
    >
      {children}
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </motion.span>
  );
};

export default GradientText;
