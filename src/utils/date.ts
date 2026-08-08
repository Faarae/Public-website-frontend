export const formatDate = (dateStr: string | Date | undefined | null): string => {
  if (!dateStr) return '-';
  
  let dateObj: Date;
  if (dateStr instanceof Date) {
    dateObj = dateStr;
  } else {
    const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
    dateObj = new Date(dateStr);
  }

  if (isNaN(dateObj.getTime())) return String(dateStr);
  
  const d = String(dateObj.getDate()).padStart(2, '0');
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const y = dateObj.getFullYear();
  return `${d}/${m}/${y}`;
};
