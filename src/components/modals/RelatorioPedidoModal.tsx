import React, { useRef, useState } from 'react';
import { X, Printer, Edit, CheckCircle2 } from 'lucide-react';
import { Pedido, useSistemas } from '../../SistemasContext';
import { RelatorioPedidoA5 } from '../RelatorioPedidoA5';
import { ReciboEntregaA5 } from '../ReciboEntregaA5';
import { safeFormat } from '../../utils/dateUtils';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

interface RelatorioPedidoModalProps {
  pedido: Pedido;
  onClose: () => void;
  onEdit: (pedido: Pedido) => void;
}

export const RelatorioPedidoModal = ({ pedido, onClose, onEdit }: RelatorioPedidoModalProps) => {
  const { clientes, materiasPrimas } = useSistemas();
  const reportRef = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isPrintingReceipt, setIsPrintingReceipt] = useState(false);

  const cliente = clientes.find(c => c.codigo === pedido.clienteCodigo);

  const handlePrint = async () => {
    if (!reportRef.current) return;
    setIsPrinting(true);
    
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
      pdf.autoPrint();
      
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      if (printWindow) {
        printWindow.location.href = pdfUrl;
      } else {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.target = '_blank';
        link.download = `Pedido_${pedido.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.info('O bloqueador de pop-ups impediu a abertura de uma nova aba. O PDF foi baixado.');
      }
      
      toast.success('Relatório gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      if (printWindow) printWindow.close();
      toast.error('Erro ao gerar o PDF. Tente novamente.');
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePrintReceipt = async () => {
    if (!receiptRef.current) return;
    setIsPrintingReceipt(true);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write('Gerando Recibo, por favor aguarde...');
    }

    try {
      const canvas = await html2canvas(receiptRef.current, { 
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (document, element) => {
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
      pdf.autoPrint();
      
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      if (printWindow) {
        printWindow.location.href = pdfUrl;
      } else {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.target = '_blank';
        link.download = `Recibo_Entrega_${pedido.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.info('O bloqueador de pop-ups impediu a abertura de uma nova aba. O PDF foi baixado.');
      }
      
      toast.success('Recibo gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar Recibo:', error);
      if (printWindow) printWindow.close();
      toast.error('Erro ao gerar o Recibo. Tente novamente.');
    } finally {
      setIsPrintingReceipt(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 max-w-5xl w-full shadow-2xl border border-gold/30 flex flex-col max-h-[95vh]">
        <div className="flex justify-between items-center mb-4 border-b border-gold/20 pb-4">
          <h3 className="text-xl font-serif font-bold text-gray-900">Relatório de Pedido</h3>
          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrintReceipt}
              disabled={isPrintingReceipt}
              className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors disabled:opacity-50"
              title="Imprimir Recibo de Entrega"
            >
              <CheckCircle2 size={18} />
              {isPrintingReceipt ? 'Gerando Recibo...' : 'Recibo de Entrega'}
            </button>
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
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
            <button 
              onClick={() => onEdit(pedido)}
              className="bg-gradient-to-r from-gold-dark to-gold text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-gold/30 text-sm"
            >
              <Edit size={18} />
              Editar Pedido
            </button>
          </div>

          {/* Container A5 para visualização e impressão */}
          <div className="bg-white shadow-md mb-8" style={{ width: '148mm', minHeight: '210mm' }}>
            <RelatorioPedidoA5 
              ref={reportRef} 
              pedido={pedido} 
              cliente={cliente} 
              materiasPrimas={materiasPrimas} 
            />
          </div>

          {/* Recibo de Entrega (Oculto para visualização, mas disponível para o html2canvas) */}
          <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
            <div ref={receiptRef} style={{ width: '148mm', minHeight: '210mm', backgroundColor: 'white' }}>
              <ReciboEntregaA5 
                pedido={pedido}
                cliente={cliente}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center border-t border-gold/20 pt-4">
          <p className="text-sm text-gray-500 font-medium">Status atual: <span className="uppercase font-bold text-gray-700">{pedido.status}</span></p>
          <p className="text-sm text-gray-500 font-medium">Data de Criação: <span className="font-bold text-gray-700">{safeFormat(pedido.dataCriacao)}</span></p>
        </div>
      </div>
    </div>
  );
};
