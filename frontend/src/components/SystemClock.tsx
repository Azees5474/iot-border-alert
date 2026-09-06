import { useEffect, useState } from 'react';

interface SystemClockProps {
  className?: string;
}

const pad = (n: number) => n.toString().padStart(2, '0');

const SystemClock = ({ className = '' }: SystemClockProps) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  return (
    <span className={`hud-value tabular-nums ${className}`} aria-live="off">
      {time}
    </span>
  );
};

export default SystemClock;
