import React from 'react';
import { Cliente } from '../../SistemasContext';
import { XCircle, Cake, MessageCircle } from 'lucide-react';

interface BirthdayAlertModalProps {
  onClose: () => void;
  aniversariantes: Cliente[];
}

export const BirthdayAlertModal: React.FC<BirthdayAlertModalProps> = ({ onClose, aniversariantes }) => {
  const handleSendMessage = (cliente: Cliente) => {
    const message = `Olá ${cliente.nome}! A equipe Rosi e Freire deseja a você um feliz aniversário!`;
    const whatsappUrl = `whatsapp://send?phone=${cliente.telefone}&text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const message = aniversariantes.length > 1 
    ? "Hoje é dia de festa! Temos aniversariantes especiais."
    : "Hoje é dia de festa! Temos um aniversariante especial.";

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-yellow-300 to-orange-400 rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-white animate-in fade-in zoom-in duration-300 flex flex-col gap-6 relative overflow-hidden">
        {/* Confetti effect (simplified) */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-4 h-4 bg-red-500 rounded-full animate-confetti-1"></div>
          <div className="absolute top-1/4 right-1/4 w-3 h-3 bg-blue-500 rounded-full animate-confetti-2"></div>
          <div className="absolute bottom-1/2 left-1/2 w-5 h-5 bg-green-500 rounded-full animate-confetti-3"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-purple-500 rounded-full animate-confetti-4"></div>
        </div>

        <div className="flex justify-between items-center relative z-10">
          <h3 className="text-2xl font-serif font-bold text-gray-900">🎉 Feliz Aniversário! 🎉</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
            <XCircle size={24} />
          </button>
        </div>

        <div className="flex flex-col items-center text-center relative z-10">
          <Cake size={64} className="text-red-500 mb-4 animate-bounce-slow" />
          <p className="text-lg font-semibold text-gray-800 mb-4">{message}</p>
          
          {aniversariantes.map(cliente => (
            <div key={cliente.codigo} className="flex items-center gap-2 mb-2">
              <span className="font-medium text-gray-700">- {cliente.nome}</span>
              <button 
                onClick={() => handleSendMessage(cliente)}
                className="p-1.5 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors shadow-md"
                title="Enviar mensagem de WhatsApp"
              >
                <MessageCircle size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-center relative z-10">
          <button 
            onClick={onClose}
            className="bg-gray-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-gray-900/20"
          >
            <XCircle size={20} />
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

// Basic confetti animations (add to global CSS or a style block if needed)
// @keyframes confetti-1 { 0% { transform: translate(0, 0) rotate(0deg); opacity: 1; } 100% { transform: translate(100px, 200px) rotate(360deg); opacity: 0; } }
// @keyframes confetti-2 { 0% { transform: translate(0, 0) rotate(0deg); opacity: 1; } 100% { transform: translate(-150px, 150px) rotate(-360deg); opacity: 0; } }
// @keyframes confetti-3 { 0% { transform: translate(0, 0) rotate(0deg); opacity: 1; } 100% { transform: translate(200px, -100px) rotate(180deg); opacity: 0; } }
// @keyframes confetti-4 { 0% { transform: translate(0, 0) rotate(0deg); opacity: 1; } 100% { transform: translate(-100px, -200px) rotate(-180deg); opacity: 0; } }

// .animate-confetti-1 { animation: confetti-1 3s ease-out infinite; }
// .animate-confetti-2 { animation: confetti-2 3.5s ease-out infinite; }
// .animate-confetti-3 { animation: confetti-3 2.8s ease-out infinite; }
// .animate-confetti-4 { animation: confetti-4 3.2s ease-out infinite; }

// .animate-bounce-slow { animation: bounce 2s infinite; }
// @keyframes bounce { 0%, 100% { transform: translateY(-5%); } 50% { transform: translateY(0); } }
