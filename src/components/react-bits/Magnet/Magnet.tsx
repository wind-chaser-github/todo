import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export interface MagnetProps {
  children: React.ReactNode;
  padding?: number;
  disabled?: boolean;
  magnetStrength?: number;
  className?: string;
}

export default function Magnet({ 
  children, 
  padding = 100, 
  disabled = false, 
  magnetStrength = 2,
  className = ''
}: MagnetProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const magnetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) {
      setPosition({ x: 0, y: 0 });
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!magnetRef.current) return;
      const { left, top, width, height } = magnetRef.current.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      const distX = e.clientX - centerX;
      const distY = e.clientY - centerY;
      const distance = Math.sqrt(distX * distX + distY * distY);

      if (distance < Math.max(width, height) / 2 + padding) {
        setPosition({ x: distX / magnetStrength, y: distY / magnetStrength });
      } else {
        setPosition({ x: 0, y: 0 });
      }
    };

    const handleMouseLeave = () => setPosition({ x: 0, y: 0 });

    window.addEventListener('mousemove', handleMouseMove);
    if (magnetRef.current) {
      magnetRef.current.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (magnetRef.current) {
        magnetRef.current.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [disabled, magnetStrength, padding]);

  return (
    <motion.div
      ref={magnetRef}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
}
