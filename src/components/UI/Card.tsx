import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', hover = true }) => {
  return (
    <motion.div
      whileHover={hover ? { y: -2, scale: 1.02 } : undefined}
      transition={{ duration: 0.2 }}
      className={`bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-lg ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default Card;