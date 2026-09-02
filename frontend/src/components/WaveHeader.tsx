import { FC, ReactNode } from 'react';

interface WaveHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children?: ReactNode;
}

const WaveHeader: FC<WaveHeaderProps> = ({ title, subtitle, icon, children }) => {
  return (
    <div className="relative wave-divider bg-ocean-gradient text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 left-[10%] w-16 h-16 border-2 border-white rounded-full animate-pulse-slow" />
        <div className="absolute top-8 right-[15%] w-8 h-8 border-2 border-white rounded-full animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-4 left-[30%] w-12 h-12 border-2 border-white rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-8 right-[25%] w-6 h-6 border-2 border-white rounded-full animate-pulse-slow" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Fishing boat SVG */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-10 animate-float hidden lg:block">
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-white">
          <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
          <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76" />
          <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6" />
          <path d="M12 10v4" />
          <path d="M12 2v3" />
        </svg>
      </div>

      <div className="relative z-10 px-6 py-8 md:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 animate-float">
              {icon}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
              {subtitle && (
                <p className="text-ocean-200 text-sm md:text-base mt-1 animate-fade-in">{subtitle}</p>
              )}
            </div>
          </div>
          {children && <div className="hidden md:flex items-center gap-3">{children}</div>}
        </div>
      </div>

      {/* Wave SVG divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-12 md:h-16">
          <path 
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" 
            fill="#f0f9ff"
          />
        </svg>
      </div>
    </div>
  );
};

export default WaveHeader;
