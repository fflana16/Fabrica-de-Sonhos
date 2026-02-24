import { parseISO, parse } from 'date-fns';

export const parseDate = (dateString: string): Date | null => {
  try {
    // Tenta parsear como ISO 8601 (YYYY-MM-DD)
    const isoDate = parseISO(dateString);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }
    // Tenta parsear como DD/MM/YYYY
    const ptDate = parse(dateString, 'dd/MM/yyyy', new Date());
    if (!isNaN(ptDate.getTime())) {
      return ptDate;
    }
    return null;
  } catch (error) {
    return null;
  }
};
