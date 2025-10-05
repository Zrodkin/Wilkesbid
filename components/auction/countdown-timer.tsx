// components/auction/countdown-timer.tsx
'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const Confetti = dynamic(() => import('react-confetti'), { ssr: false });

interface CountdownTimerProps {
  endTime: string;
  status: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function CountdownTimer({ endTime, status }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isEnded, setIsEnded] = useState(status === 'ended');
  const [showConfetti, setShowConfetti] = useState(false);
  
  useEffect(() => {
    const calculateTimeLeft = (): TimeLeft => {
      const difference = new Date(endTime).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        setIsEnded(true);
        
        // Check if this is the first time viewing after auction ended
        const confettiKey = `auction_confetti_${endTime}`;
        const hasSeenConfetti = localStorage.getItem(confettiKey);
        
        if (!hasSeenConfetti) {
          setShowConfetti(true);
          localStorage.setItem(confettiKey, 'true');
          
          // Hide confetti after 5 seconds
          setTimeout(() => setShowConfetti(false), 5000);
          
          // Trigger winner notifications (only once)
          if (!localStorage.getItem('winner_notifications_sent')) {
            fetch('/api/notifications/winners', { method: 'POST' });
            localStorage.setItem('winner_notifications_sent', 'true');
          }
        }
        
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
      
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    };
    
    // Initial calculation
    setTimeLeft(calculateTimeLeft());
    
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    
    return () => clearInterval(timer);
  }, [endTime]);
  
  const formatNumber = (num: number) => String(num).padStart(2, '0');
  
  if (isEnded) {
    return (
      <>
        {showConfetti && (
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={200}
          />
        )}
        <div className="flex flex-col items-center gap-4 sm:gap-6">
          <p className="text-sm sm:text-base font-medium text-neutral-400 tracking-wider uppercase">
            Auction Has Ended
          </p>
          <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-red-500 animate-pulse">
            AUCTION ENDED
          </div>
          <p className="text-neutral-400 text-sm sm:text-base">
            Winners have been notified by email
          </p>
        </div>
      </>
    );
  }
  
  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6">
      <p className="text-sm sm:text-base font-medium text-neutral-400 tracking-wider uppercase">
        Time Remaining
      </p>
      <div className="flex gap-2 sm:gap-3 md:gap-4">
        <TimeUnit value={formatNumber(timeLeft.days)} label="DAYS" />
        <TimeUnit value={formatNumber(timeLeft.hours)} label="HOURS" />
        <TimeUnit value={formatNumber(timeLeft.minutes)} label="MINUTES" />
        <TimeUnit value={formatNumber(timeLeft.seconds)} label="SECONDS" />
      </div>
    </div>
  );
}

function TimeUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3">
      <div className="relative bg-gradient-to-b from-neutral-700 to-neutral-800 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden w-16 h-20 sm:w-20 sm:h-24 md:w-24 md:h-28 lg:w-28 lg:h-32">
        {/* Top half */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-neutral-600 to-neutral-700"
          style={{ clipPath: 'inset(0 0 50% 0)' }}
        />
        {/* Flip line */}
        <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-neutral-900/50 -translate-y-1/2" />
        {/* Number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white font-mono tracking-tighter">
            {value}
          </span>
        </div>
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
      </div>
      <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-[#C9A961] tracking-widest">
        {label}
      </span>
    </div>
  );
}