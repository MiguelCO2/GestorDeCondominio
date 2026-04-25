// Formateadores para Bs. (VES). Centralizados para no repetirlos.

export const fmt = (n: number) =>
  'Bs. ' +
  n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Solo el número (sin "Bs.")
export const fmtNum = (n: number, decimals = 2) =>
  n.toLocaleString('es-VE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
