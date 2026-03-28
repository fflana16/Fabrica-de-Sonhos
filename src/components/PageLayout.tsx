import React, { ReactNode } from 'react';
import { ArrowLeft, ChevronLeft } from 'lucide-react';

interface PageLayoutProps {
  title: string;
  children?: ReactNode;
  onBack: () => void;
  onBackStep?: () => void;
  onBackToCategory?: () => void;
  categoryName?: string;
}

export const PageLayout = ({ title, children, onBack, onBackStep, onBackToCategory, categoryName }: PageLayoutProps) => (
  <main className="flex-grow flex flex-col items-center justify-start px-4 py-4 relative z-10 w-full">
    <div className="absolute inset-0 max-w-[98%] mx-auto my-auto h-[94%] bg-white/10 backdrop-blur-sm rounded-[2.5rem] -z-10 border border-white/20 shadow-2xl"></div>
    <div className="w-full max-w-[96%] p-4 md:p-6 flex flex-col items-start h-full">
      <div className="flex flex-wrap gap-2 mb-2">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gold-dark hover:text-gold transition-colors glass-button px-4 py-1.5 rounded-full w-fit text-xs"
        >
          <ArrowLeft size={16} />
          <span className="font-medium">Voltar ao Início</span>
        </button>
        {onBackToCategory && categoryName && (
          <button 
            onClick={onBackToCategory}
            className="flex items-center gap-2 text-gold-dark hover:text-gold transition-colors glass-button px-4 py-1.5 rounded-full w-fit text-xs"
          >
            <ArrowLeft size={16} />
            <span className="font-medium">Voltar para {categoryName}</span>
          </button>
        )}
        {onBackStep && (
          <button 
            onClick={onBackStep}
            className="flex items-center gap-2 text-gold-dark hover:text-gold transition-colors glass-button px-4 py-1.5 rounded-full w-fit text-xs"
          >
            <ChevronLeft size={16} />
            <span className="font-medium">Voltar</span>
          </button>
        )}
      </div>
      <div className="w-full flex-grow flex flex-col items-center justify-start">
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
