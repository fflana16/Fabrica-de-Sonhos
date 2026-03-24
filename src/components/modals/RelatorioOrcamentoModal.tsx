import React, { useRef, useState } from 'react';
import { X, Printer, CheckCircle2, XCircle } from 'lucide-react';
import { Orcamento, useSistemas } from '../../SistemasContext';
import { RelatorioOrcamentoA5 } from '../RelatorioOrcamentoA5';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { CancelamentoOrcamentoModal } from './CancelamentoOrcamentoModal';
import { ConversaoOrcamentoModal } from './ConversaoOrcamentoModal';
import { toast } from 'sonner';

interface RelatorioOrcamentoModalProps {
  orcamento: Orcamento;
  onClose: () => void;
}

export const RelatorioOrcamentoModal = ({ orcamento, onClose }: RelatorioOrcamentoModalProps) => {
  const { clientes, materiasPrimas, updateOrcamento } = useSistemas();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);

  const cliente = clientes.find(c => c.codigo === orcamento.clienteCodigo);

  const handlePrint = async () => {
    if (!reportRef.current) return;
    setIsPrinting(true);
    
    // Open window immediately to avoid popup blocker (since html2canvas is async)
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write('Gerando PDF, por favor aguarde...');
    }

    try {
      const canvas = await html2canvas(reportRef.current, { 
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (document, element) => {
          // html2canvas doesn't support oklch, so we need to ensure no elements have it
          // Tailwind v4 uses oklch by default, but we've replaced classes with inline styles
          // in RelatorioOrcamentoA5. This is just a fallback.
          const elements = element.querySelectorAll('*');
          elements.forEach((el: any) => {
            const style = window.getComputedStyle(el);
            if (style.color && style.color.includes('oklch')) {
              el.style.color = '#000000';
            }
            if (style.backgroundColor && style.backgroundColor.includes('oklch')) {
              el.style.backgroundColor = '#ffffff';
            }
            if (style.borderColor && style.borderColor.includes('oklch')) {
              el.style.borderColor = '#e5e7eb';
            }
          });
        }
      });
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = 148; // A5 width in mm
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, Math.max(210, pdfHeight)]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // Auto-open print dialog when PDF is opened
      pdf.autoPrint();
      
      // Open PDF in a new tab for printing
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      if (printWindow) {
        printWindow.location.href = pdfUrl;
      } else {
        // Fallback if popup was blocked: trigger download and try a link click
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.target = '_blank';
        link.download = `Orcamento_${orcamento.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.info('O bloqueador de pop-ups impediu a abertura de uma nova aba. O PDF foi baixado.');
      }
      
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      if (printWindow) printWindow.close();
      toast.error('Erro ao gerar o PDF. Tente novamente.');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleCancelConfirm = (justificativa: string) => {
    updateOrcamento(orcamento.id, { status: 'CANCELADO', justificativaCancelamento: justificativa });
    toast.success('Orçamento cancelado com sucesso.');
    setShowCancelModal(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 max-w-5xl w-full shadow-2xl border border-gold/30 flex flex-col max-h-[95vh]">
        <div className="flex justify-between items-center mb-4 border-b border-gold/20 pb-4">
          <h3 className="text-xl font-serif font-bold text-gray-900">Relatório de Orçamento</h3>
          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrint}
              disabled={isPrinting}
              className="bg-gray-800 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <Printer size={18} />
              {isPrinting ? 'Gerando PDF...' : 'Imprimir PDF (A5)'}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-100 p-4 rounded-xl flex flex-col items-center border border-gray-200 shadow-inner relative">
          {/* Floating Action Buttons */}
          {orcamento.status !== 'CONVERTIDO' && orcamento.status !== 'RECUSADO' && orcamento.status !== 'CANCELADO' && (
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              <button 
                onClick={() => setShowConvertModal(true)}
                className="bg-gradient-to-r from-green-600 to-green-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-green-500/30 text-sm"
              >
                <CheckCircle2 size={18} />
                Converter em Pedido
              </button>
              <button 
                onClick={() => setShowCancelModal(true)}
                className="bg-white border-2 border-red-500 text-red-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-red-50 transition-colors shadow-lg text-sm"
              >
                <XCircle size={18} />
                Cancelar Orçamento
              </button>
            </div>
          )}

          {orcamento.status === 'CANCELADO' && orcamento.justificativaCancelamento && (
            <div className="w-full max-w-[148mm] mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm">
              <p className="text-sm font-bold text-red-800 uppercase mb-1">Motivo do Cancelamento:</p>
              <p className="text-sm text-red-700">{orcamento.justificativaCancelamento}</p>
            </div>
          )}
          
          {/* Container A5 para visualização e impressão */}
          <div className="bg-white shadow-md" style={{ width: '148mm', minHeight: '210mm' }}>
            <RelatorioOrcamentoA5 
              ref={reportRef} 
              orcamento={orcamento} 
              cliente={cliente} 
              materiasPrimas={materiasPrimas} 
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end items-center border-t border-gold/20 pt-4">
          <p className="text-sm text-gray-500 font-medium">Status atual: <span className="uppercase font-bold text-gray-700">{orcamento.status}</span></p>
        </div>
      </div>

      {showCancelModal && (
        <CancelamentoOrcamentoModal 
          orcamento={orcamento}
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleCancelConfirm}
        />
      )}

      {showConvertModal && (
        <ConversaoOrcamentoModal 
          orcamento={orcamento}
          onClose={() => {
            setShowConvertModal(false);
            onClose(); // Fechar o relatório também após converter
          }}
        />
      )}
    </div>
  );
};
