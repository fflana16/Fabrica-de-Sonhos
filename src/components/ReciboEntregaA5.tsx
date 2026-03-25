import React, { forwardRef } from 'react';
import { Pedido, Cliente } from '../SistemasContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { safeFormat } from '../utils/dateUtils';

interface ReciboEntregaA5Props {
  pedido: Pedido;
  cliente: Cliente | undefined;
}

export const ReciboEntregaA5 = forwardRef<HTMLDivElement, ReciboEntregaA5Props>(
  ({ pedido, cliente }, ref) => {
    const dataAtual = new Date();

    return (
      <div ref={ref} style={{ padding: '2rem', margin: '0 auto', width: '148mm', minHeight: '210mm', fontFamily: 'sans-serif', backgroundColor: '#ffffff', color: '#000000', position: 'relative', display: 'flex', flexDirection: 'column' }}>
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
            <p style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '0.875rem', marginBottom: '0.25rem', marginTop: 0 }}>PEDIDO Nº {pedido.id}</p>
            <p style={{ margin: 0 }}>Data: {format(dataAtual, "dd/MM/yyyy", { locale: ptBR })}</p>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.1em', border: '2px solid #111827', padding: '0.5rem', display: 'inline-block' }}>Recibo de Entrega</h2>
        </div>

        <div style={{ marginBottom: '2rem', fontSize: '1rem', lineHeight: '1.6', color: '#1f2937' }}>
          <p style={{ margin: '0 0 1rem 0' }}>
            Recebi de <strong>Rosi e Freire - Fábrica de Sonhos</strong> os produtos referentes ao pedido <strong>{pedido.id}</strong>, em perfeitas condições de uso e conforme o solicitado.
          </p>
          
          <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
            <p style={{ margin: '0 0 0.5rem 0' }}><span style={{ fontWeight: 600 }}>Cliente:</span> {cliente?.nome}</p>
            <p style={{ margin: '0 0 0.5rem 0' }}><span style={{ fontWeight: 600 }}>CPF/CNPJ:</span> {cliente?.cpfCnpj || '___________________________'}</p>
            <p style={{ margin: 0 }}><span style={{ fontWeight: 600 }}>Data do Pedido:</span> {safeFormat(pedido.dataCriacao)}</p>
          </div>

          <h3 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.25rem' }}>Itens Entregues:</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {pedido.itens.map((item, index) => (
              <li key={index} style={{ padding: '0.25rem 0', borderBottom: '1px dashed #e5e7eb', fontSize: '0.875rem' }}>
                {item.quantidade}x {item.nomeProduto} {item.tipoProduto === 'LASER' ? '(Corte a Laser)' : ''}
              </li>
            ))}
          </ul>
        </div>

        <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px dashed #9ca3af', borderRadius: '0.5rem', backgroundColor: '#f9fafb' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem', margin: 0 }}>
            Autoriza publicarmos a arte no nosso Instagram e marcar você?
          </p>
          <div style={{ display: 'flex', gap: '2rem', fontSize: '1rem', color: '#1f2937' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>( ) Sim</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>( ) Não</span>
          </div>
        </div>

        <div style={{ marginTop: 'auto', marginBottom: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '2rem' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ borderBottom: '1px solid #000', marginBottom: '0.5rem' }}></div>
              <p style={{ fontSize: '0.75rem', margin: 0, fontWeight: 'bold' }}>Assinatura do Cliente</p>
              <p style={{ fontSize: '0.75rem', margin: 0, color: '#6b7280' }}>{cliente?.nome}</p>
            </div>
            <div style={{ width: '120px', textAlign: 'center' }}>
              <div style={{ borderBottom: '1px solid #000', marginBottom: '0.5rem', minHeight: '1.5rem' }}>
                {/* Deixado em branco para preenchimento manual */}
              </div>
              <p style={{ fontSize: '0.75rem', margin: 0, fontWeight: 'bold' }}>Data de Entrega</p>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div style={{ paddingTop: '2rem', textAlign: 'center', fontSize: '10px', color: '#6b7280', borderTop: '1px solid #e5e7eb' }}>
          <p style={{ margin: '0 0 0.25rem 0' }}>Rosi e Freire - Fábrica de Sonhos</p>
          <p style={{ margin: '0 0 0.25rem 0' }}>Rua Rio de Janeiro, Nº. 1 - Bairro: Amaro Lanari - Coronel Fabriciano - MG | CEP: 35171-313</p>
          <p style={{ margin: 0 }}>(31) 99444-0225 | @rosiefreire_fabricadesonhos</p>
        </div>
      </div>
    );
  }
);

ReciboEntregaA5.displayName = 'ReciboEntregaA5';
