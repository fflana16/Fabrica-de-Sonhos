import { parseISO, parse, format, isValid, differenceInYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const parseDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  try {
    // Tenta parsear como ISO 8601 (YYYY-MM-DD)
    const isoDate = parseISO(dateString);
    if (isValid(isoDate)) {
      return isoDate;
    }
    // Tenta parsear como DD/MM/YYYY
    const ptDate = parse(dateString, 'dd/MM/yyyy', new Date());
    if (isValid(ptDate)) {
      return ptDate;
    }
    
    // Tenta new Date() como fallback
    const fallbackDate = new Date(dateString);
    if (isValid(fallbackDate)) {
      return fallbackDate;
    }

    return null;
  } catch (error) {
    return null;
  }
};

export const calculateAge = (birthDate: string | null | undefined): number | null => {
  const date = parseDate(birthDate);
  if (!date || !isValid(date)) return null;
  return differenceInYears(new Date(), date);
};

export const safeFormat = (
  date: Date | string | null | undefined, 
  formatStr: string = 'dd/MM/yyyy',
  fallback: string = 'N/A'
): string => {
  if (!date) return fallback;
  
  const dateObj = typeof date === 'string' ? parseDate(date) : date;
  
  if (!dateObj || !isValid(dateObj)) {
    return fallback;
  }
  
  try {
    return format(dateObj, formatStr, { locale: ptBR });
  } catch (error) {
    return fallback;
  }
};
