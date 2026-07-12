import React, { useState, useRef, useEffect } from 'react';

interface Premium3DTiltCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  key?: React.Key;
}

export function Premium3DTiltCard({ children, className = '', onClick }: Premium3DTiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device to bypass expensive tilt calculations and prevent weird touch layouts
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        window.matchMedia('(max-width: 768px)').matches ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      );
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile || !cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    
    // Coordinates normalized from -0.5 to 0.5 relative to center of card
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    
    setCoords({ x, y });
  };

  const handleMouseEnter = () => {
    if (isMobile) return;
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setCoords({ x: 0, y: 0 });
  };

  // Tilt amounts (limited to max 10 degrees for elegant sub-pixel stability)
  const tiltX = isHovered ? -coords.y * 12 : 0;
  const tiltY = isHovered ? coords.x * 12 : 0;
  
  // Custom reflections (glare) tracking the cursor position
  const glareX = isHovered ? (coords.x + 0.5) * 100 : 50;
  const glareY = isHovered ? (coords.y + 0.5) * 100 : 50;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`relative transition-all duration-300 ease-out select-none will-change-transform ${className}`}
      style={{
        transform: isHovered && !isMobile
          ? `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transformStyle: 'preserve-3d',
        boxShadow: isHovered && !isMobile
          ? '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(255, 45, 141, 0.12)'
          : '0 10px 30px -15px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Glare gloss highlight overlay */}
      {isHovered && !isMobile && (
        <div 
          className="absolute inset-0 rounded-2xl pointer-events-none z-15 opacity-40 transition-opacity duration-300 mix-blend-overlay"
          style={{
            background: `radial-gradient(circle 180px at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0) 80%)`
          }}
        />
      )}

      {/* Cybernetic ambient neon inner border shadow effect */}
      {isHovered && !isMobile && (
        <div 
          className="absolute inset-0 rounded-2xl pointer-events-none z-20 transition-all duration-300"
          style={{
            border: '1.5px solid var(--brand-color)',
            opacity: 0.35,
            boxShadow: 'inset 0 0 15px var(--brand-color)',
          }}
        />
      )}

      {/* Actual Content Wrapper with deep offset translation */}
      <div 
        className="h-full flex flex-col justify-between"
        style={{ 
          transform: isHovered && !isMobile ? 'translateZ(15px)' : 'translateZ(0px)',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.3s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
}
