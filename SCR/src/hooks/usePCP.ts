import { useMemo } from 'react';
import { useSistemas, Pedido } from '../SistemasContext';
import { format, addDays, isWeekend, parseISO } from 'date-fns';

const CAPACIDADE_DIARIA_MINUTOS = 420; // 7 horas

const FERIADOS: string[] = [
  '2026-01-01', '2026-02-24', '2026-02-25', '2026-04-10', '2026-04-21',
  '2026-05-01', '2026-06-11', '2026-09-07', '2026-10-12', '2026-11-02',
  '2026-11-15', '2026-12-25',
];

const isBusinessDay = (date: Date) => {
  const dateString = format(date, 'yyyy-MM-dd');
  return !isWeekend(date) && !FERIADOS.includes(dateString);
};

export const usePCP = () => {
  const { pedidos } = useSistemas();

  const loadMap = useMemo(() => {
    const map: { [key: string]: number } = {};
    const pedidosAtivos = pedidos.filter(ped => 
      ped.status !== 'Entregue' && ped.status !== 'Pronto'
    ).sort((a, b) => new Date(a.dataCriacao).getTime() - new Date(b.dataCriacao).getTime());

    pedidosAtivos.forEach(order => {
      let totalMinutes = order.itens.reduce((acc, item) => acc + (item.tempoMaquina + item.tempoPintura + item.tempoMontagem) * item.quantidade, 0);
      let remainingMins = totalMinutes;
      let checkDate = new Date(order.dataCriacao);

      while (remainingMins > 0) {
        const dateKey = format(checkDate, 'yyyy-MM-dd');
        if (isBusinessDay(checkDate)) {
          const used = map[dateKey] || 0;
          const available = CAPACIDADE_DIARIA_MINUTOS - used;
          
          if (available > 0) {
            const consume = Math.min(remainingMins, available);
            map[dateKey] = (map[dateKey] || 0) + consume;
            remainingMins -= consume;
          }
        }
        checkDate = addDays(checkDate, 1);
      }
    });
    return map;
  }, [pedidos]);

  const findAvailableDate = (totalMinutes: number) => {
    let checkDate = new Date();
    let remainingMins = totalMinutes;

    while (remainingMins > 0) {
      const dateKey = format(checkDate, 'yyyy-MM-dd');
      if (isBusinessDay(checkDate)) {
        const used = loadMap[dateKey] || 0;
        const available = CAPACIDADE_DIARIA_MINUTOS - used;
        
        if (available > 0) {
          const consume = Math.min(remainingMins, available);
          remainingMins -= consume;
        }
      }
      if (remainingMins > 0) {
        checkDate = addDays(checkDate, 1);
      }
    }
    return checkDate;
  };

  return { findAvailableDate, loadMap };
};
