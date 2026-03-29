import React, { forwardRef } from 'react';
import { Orcamento, Cliente, MateriaPrima } from '../SistemasContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RelatorioOrcamentoA5Props {
  orcamento: Orcamento;
  cliente: Cliente | undefined;
  materiasPrimas: MateriaPrima[];
}

const addBusinessDays = (date: Date, days: number) => {
  let result = new Date(date);
  let addedDays = 0;
  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    if (result.getDay() !== 0 && result.getDay() !== 6) {
      addedDays++;
    }
  }
  return result;
};

export const RelatorioOrcamentoA5 = forwardRef<HTMLDivElement, RelatorioOrcamentoA5Props>(
  ({ orcamento, cliente, materiasPrimas }, ref) => {
    const dataAtual = new Date();
    return (
      <div ref={ref} style={{ padding: '2rem', margin: '0 auto', width: '148mm', minHeight: '210mm', fontFamily: 'sans-serif', backgroundColor: '#ffffff', color: '#000000', position: 'relative' }}>
        {/* Cabeçalho */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #1f2937', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '4rem', height: '4rem', borderRadius: '9999px', border: '2px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' }}>
              <span style={{ fontFamily: 'serif', fontWeight: 'bold', color: '#1f2937', fontSize: '1.25rem' }}>RF</span>
            </div>
            <div>
              <h1 style={{ fontFamily: 'serif', fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', lineHeight: '1.25', margin: 0 }}>Rosi e Freire</h1>
              <h2 style={{ fontSize: '0.75rem', letterSpacing: '0.2em', color: '#4b5563', textTransform: 'uppercase', margin: 0 }}>Fábrica de Sonhos</h2>
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#4b5563' }}>
            <p style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '0.875rem', marginBottom: '0.25rem', marginTop: 0 }}>ORÇAMENTO Nº {orcamento.id}</p>
            <p style={{ margin: 0 }}>Data: {format(dataAtual, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
            <p style={{ margin: 0 }}>Operador: {orcamento.operador}</p>
          </div>
        </div>

        {/* Dados do Cliente */}
        <div style={{ marginBottom: '1.5rem', backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.25rem', marginTop: 0 }}>Dados do Cliente</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.5rem', fontSize: '0.875rem' }}>
            <p style={{ margin: 0 }}><span style={{ fontWeight: 600 }}>Código:</span> {cliente?.codigo}</p>
            <p style={{ margin: 0 }}><span style={{ fontWeight: 600 }}>Nome:</span> {cliente?.nome}</p>
            <p style={{ margin: 0 }}><span style={{ fontWeight: 600 }}>Telefone:</span> {cliente?.telefone || cliente?.whatsapp}</p>
            <p style={{ margin: 0 }}><span style={{ fontWeight: 600 }}>Instagram:</span> {cliente?.instagram}</p>
          </div>
        </div>

        {/* Itens do Orçamento */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem', textTransform: 'uppercase', borderBottom: '1px solid #1f2937', paddingBottom: '0.25rem', marginTop: 0 }}>Itens do Orçamento</h3>
          <table style={{ width: '100%', fontSize: '0.875rem', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '1px solid #d1d5db' }}>
                <th style={{ padding: '0.5rem', fontWeight: 600 }}>Descrição</th>
                <th style={{ padding: '0.5rem', fontWeight: 600, textAlign: 'center', width: '4rem' }}>Qtd</th>
                <th style={{ padding: '0.5rem', fontWeight: 600, textAlign: 'right', width: '6rem' }}>V. Unit.</th>
                <th style={{ padding: '0.5rem', fontWeight: 600, textAlign: 'right', width: '6rem' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {orcamento.itens.map((item, index) => {
                let descricaoExtra = '';
                if (item.tipoProduto === 'LASER') {
                  descricaoExtra = ' (Corte a Laser)';
                }

                return (
                  <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <p style={{ fontWeight: 500, color: '#1f2937', margin: 0 }}>{item.nomeProduto}{descricaoExtra}</p>
                        {item.isIgreja && (
                          <span style={{ fontSize: '9px', fontWeight: 'bold', backgroundColor: '#fef3c7', color: '#92400e', padding: '1px 4px', borderRadius: '4px', border: '1px solid #f59e0b' }}>IGREJA</span>
                        )}
                      </div>
                      {item.observacoes && <p style={{ fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic', marginTop: '0.125rem', marginBottom: 0 }}>Obs: {item.observacoes}</p>}
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>{item.quantidade}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>R$ {item.precoVendaUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 500 }}>R$ {(item.quantidade * item.precoVendaUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totais */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
          <div style={{ width: '50%', backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#4b5563' }}>Sinal Sugerido (50%):</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1f2937' }}>R$ {orcamento.sinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #d1d5db', paddingTop: '0.5rem' }}>
              <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#111827' }}>Total Geral:</span>
              <span style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#111827' }}>R$ {orcamento.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Prazos e Observações */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#1f2937', marginBottom: '1rem', marginTop: 0 }}>
            <span style={{ fontWeight: 'bold' }}>Data de Entrega Prevista:</span> {orcamento.dataEntregaDesejada ? format(new Date(orcamento.dataEntregaDesejada), 'dd/MM/yyyy', { locale: ptBR }) : 'A combinar'}
          </p>
          
          <div style={{ borderLeft: '4px solid #9ca3af', paddingLeft: '1rem', paddingBottom: '0.5rem', paddingTop: '0.5rem', backgroundColor: '#f9fafb', color: '#374151', fontSize: '0.75rem', textAlign: 'justify', lineHeight: '1.625' }}>
            <p style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '0.25rem', textTransform: 'uppercase', marginTop: 0 }}>Observação Logística:</p>
            <p style={{ margin: 0 }}>
              "Os prazos de entrega aqui estimados estão sujeitos a revalidação no ato da efetivação do pedido. Como nosso cronograma de produção é dinâmico e operamos por ordem de confirmação, a entrada de novos projetos de grande porte entre a emissão deste orçamento e sua aprovação pode impactar a disponibilidade da data inicialmente sugerida. Garantimos a reserva da sua vaga na linha de produção mediante a confirmação do pedido até a data de validade: <span style={{ fontWeight: 'bold', color: '#111827' }}>{format(addBusinessDays(new Date(orcamento.dataCriacao), 3), 'dd/MM/yyyy')}</span>."
            </p>
          </div>
        </div>

        {/* Rodapé */}
        <div style={{ marginTop: 'auto', paddingTop: '2rem', textAlign: 'center', fontSize: '10px', color: '#6b7280', borderTop: '1px solid #e5e7eb' }}>
          <p style={{ margin: '0 0 0.25rem 0' }}>Rosi e Freire - Fábrica de Sonhos</p>
          <p style={{ margin: '0 0 0.25rem 0' }}>Rua Rio de Janeiro, Nº. 1 - Bairro: Amaro Lanari - Coronel Fabriciano - MG | CEP: 35171-313</p>
          <p style={{ margin: 0 }}>(31) 99444-0225 | @rosiefreire_fabricadesonhos</p>
        </div>
      </div>
    );
  }
);

RelatorioOrcamentoA5.displayName = 'RelatorioOrcamentoA5';
