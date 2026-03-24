import React, { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

interface PageLayoutProps {
  title: string;
  children?: ReactNode;
  onBack: () => void;
}

export const PageLayout = ({ title, children, onBack }: PageLayoutProps) => (
  <main className="flex-grow flex flex-col items-center justify-start px-4 py-4 relative z-10 w-full overflow-hidden">
    <div className="absolute inset-0 max-w-[95%] mx-auto my-auto h-[92%] bg-white/10 backdrop-blur-sm rounded-[2.5rem] -z-10 border border-white/20 shadow-2xl"></div>
    <div className="w-full max-w-[90%] p-4 md:p-6 flex flex-col items-start h-full">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gold-dark hover:text-gold transition-colors mb-2 glass-button px-4 py-1.5 rounded-full w-fit text-xs"
      >
        <ArrowLeft size={16} />
        <span className="font-medium">Voltar ao Início</span>
      </button>
      <div className="w-full flex-grow flex flex-col items-center justify-start overflow-hidden">
        <h2 className="text-xl md:text-2xl font-serif text-gold-gradient mb-4 text-center w-full">{title}</h2>
        {children || (
          <div className="w-full flex-grow flex flex-col items-center justify-center border-2 border-dashed border-gold/30 rounded-3xl bg-white/5 min-h-[200px]">
            <p className="text-gray-500 font-sans text-center">Página em construção...</p>
          </div>
        )}
      </div>
    </div>
  </main>
);
