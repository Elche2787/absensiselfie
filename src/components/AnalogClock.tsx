import React, { useState, useEffect } from 'react';

interface AnalogClockProps {
  className?: string;
}

const AnalogClock: React.FC<AnalogClockProps> = ({ className = '' }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours() % 12;

  // Calculate angles for each hand
  const secondAngle = (seconds * 6) - 90; // 6 degrees per second
  const minuteAngle = (minutes * 6) + (seconds * 0.1) - 90; // 6 degrees per minute + smooth seconds
  const hourAngle = (hours * 30) + (minutes * 0.5) - 90; // 30 degrees per hour + smooth minutes

  return (
    <div className={`relative ${className}`}>
      <svg width="120" height="120" viewBox="0 0 120 120" className="drop-shadow-lg">
        {/* Clock face */}
        <circle
          cx="60"
          cy="60"
          r="58"
          fill="white"
          stroke="#e5e7eb"
          strokeWidth="2"
        />
        
        {/* Hour markers */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30) - 90;
          const x1 = 60 + 45 * Math.cos(angle * Math.PI / 180);
          const y1 = 60 + 45 * Math.sin(angle * Math.PI / 180);
          const x2 = 60 + 50 * Math.cos(angle * Math.PI / 180);
          const y2 = 60 + 50 * Math.sin(angle * Math.PI / 180);
          
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#374151"
              strokeWidth="2"
            />
          );
        })}

        {/* Minute markers */}
        {[...Array(60)].map((_, i) => {
          if (i % 5 !== 0) { // Skip hour markers
            const angle = (i * 6) - 90;
            const x1 = 60 + 48 * Math.cos(angle * Math.PI / 180);
            const y1 = 60 + 48 * Math.sin(angle * Math.PI / 180);
            const x2 = 60 + 50 * Math.cos(angle * Math.PI / 180);
            const y2 = 60 + 50 * Math.sin(angle * Math.PI / 180);
            
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#9ca3af"
                strokeWidth="0.5"
              />
            );
          }
          return null;
        })}

        {/* Hour hand */}
        <line
          x1="60"
          y1="60"
          x2={60 + 25 * Math.cos(hourAngle * Math.PI / 180)}
          y2={60 + 25 * Math.sin(hourAngle * Math.PI / 180)}
          stroke="#1f2937"
          strokeWidth="4"
          strokeLinecap="round"
          style={{
            transition: 'all 0.5s ease-in-out',
            transformOrigin: '60px 60px'
          }}
        />

        {/* Minute hand */}
        <line
          x1="60"
          y1="60"
          x2={60 + 35 * Math.cos(minuteAngle * Math.PI / 180)}
          y2={60 + 35 * Math.sin(minuteAngle * Math.PI / 180)}
          stroke="#374151"
          strokeWidth="3"
          strokeLinecap="round"
          style={{
            transition: 'all 0.5s ease-in-out',
            transformOrigin: '60px 60px'
          }}
        />

        {/* Second hand */}
        <line
          x1="60"
          y1="60"
          x2={60 + 40 * Math.cos(secondAngle * Math.PI / 180)}
          y2={60 + 40 * Math.sin(secondAngle * Math.PI / 180)}
          stroke="#dc2626"
          strokeWidth="1"
          strokeLinecap="round"
          style={{
            transition: seconds === 0 ? 'none' : 'all 0.1s ease-out',
            transformOrigin: '60px 60px'
          }}
        />

        {/* Center dot */}
        <circle
          cx="60"
          cy="60"
          r="3"
          fill="#1f2937"
        />
        
        {/* Center dot highlight */}
        <circle
          cx="60"
          cy="60"
          r="1.5"
          fill="#dc2626"
        />
      </svg>
      
      {/* Digital time display */}
      <div className="text-center mt-2">
        <div className="text-xs font-medium text-gray-600">
          {time.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </div>
      </div>
    </div>
  );
};

export default AnalogClock;