import type { Payment } from '../data/types';
import type { PaymentsSummary } from '../data/payments';

const fmtSummary = (n: number) => 'Bs. ' + n.toLocaleString('es-VE');

export function generatePdfHtml(payments: Payment[], summary: PaymentsSummary): string {
  const currentDate = new Date().toLocaleDateString('es-VE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Totales finales de la tabla (usando los datos filtrados actualmente)
  const totalGeneral = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalCobrado = payments.filter(p => p.status === 'completado').reduce((acc, p) => acc + p.amount, 0);
  const totalPendiente = payments.filter(p => p.status === 'pendiente' && p.type !== 'Abono').reduce((acc, p) => acc + p.amount, 0);

  const getStatusStyle = (status: string) => {
    if (status === 'completado') return 'background-color: #dcfce7; color: #15803d; border-color: #bbf7d0;';
    if (status === 'pendiente') return 'background-color: #fef3c7; color: #b45309; border-color: #fde68a;';
    if (status === 'moroso') return 'background-color: #fee2e2; color: #b91c1c; border-color: #fecaca;';
    return 'background-color: #f1f5f9; color: #475569; border-color: #e2e8f0;';
  };

  const getStatusText = (status: string) => {
    if (status === 'completado') return 'Al día';
    if (status === 'pendiente') return 'Pendiente';
    if (status === 'moroso') return 'Moroso';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const rowsHtml = payments.map((p, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td><strong>${p.resident}</strong><br><span style="color:#64748b;font-size:10px;">${p.document_id || 'N/A'}</span></td>
      <td>${p.building || 'N/A'}</td>
      <td>${p.floor || 'N/A'}</td>
      <td>${p.unit_number || p.unit || 'N/A'}</td>
      <td>${p.type}</td>
      <td>${p.method}</td>
      <td style="font-weight: bold;">${p.amount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
      <td>
        <span class="status-badge" style="${getStatusStyle(p.status)}">
          ${getStatusText(p.status)}
        </span>
      </td>
      <td>${p.month || 'N/A'}</td>
      <td>${p.due_date || 'N/A'}</td>
      <td>${p.payment_date || 'N/A'}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <style>
        @page {
          size: A4;
          margin: 20mm;
        }
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #334155;
          margin: 0;
          padding: 0;
          font-size: 11px;
        }
        .header {
          border-bottom: 2px solid #2563eb;
          padding-bottom: 10px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .header-title {
          font-size: 24px;
          color: #1e293b;
          font-weight: bold;
          margin: 0;
        }
        .header-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 4px 0 0 0;
        }
        .header-date {
          font-size: 12px;
          color: #94a3b8;
        }
        
        .summary-section {
          display: flex;
          gap: 15px;
          margin-bottom: 25px;
        }
        .summary-card {
          flex: 1;
          padding: 12px;
          border-radius: 8px;
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
        }
        .summary-card.cobrado { background-color: #f0f9ff; border-color: #bae6fd; }
        .summary-card.pendiente { background-color: #fefce8; border-color: #fef08a; }
        .summary-card.moroso { background-color: #fef2f2; border-color: #fecaca; }
        
        .summary-label {
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 5px;
        }
        .summary-card.cobrado .summary-label { color: #0369a1; }
        .summary-card.pendiente .summary-label { color: #a16207; }
        .summary-card.moroso .summary-label { color: #b91c1c; }
        
        .summary-value {
          font-size: 16px;
          font-weight: bold;
          color: #0f172a;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          page-break-inside: auto;
        }
        tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
        th, td {
          padding: 10px 8px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }
        th {
          background-color: #f8fafc;
          font-weight: bold;
          color: #475569;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        tbody tr:nth-child(even) {
          background-color: #fcfcfc;
        }
        
        .status-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 9px;
          font-weight: bold;
          text-transform: uppercase;
          border-width: 1px;
          border-style: solid;
        }

        .footer-totals {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          page-break-inside: avoid;
        }
        .total-box {
          text-align: right;
        }
        .total-line {
          margin-bottom: 8px;
          font-size: 12px;
        }
        .total-line strong {
          display: inline-block;
          width: 120px;
          color: #475569;
        }
        .total-line.grand-total {
          font-size: 16px;
          font-weight: bold;
          color: #0f172a;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #cbd5e1;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="header-title">Reporte de Pagos</h1>
          <p class="header-subtitle">Gestor de Condominio</p>
        </div>
        <div class="header-date">
          Generado el: ${currentDate}
        </div>
      </div>

      <div class="summary-section">
        <div class="summary-card">
          <div class="summary-label">Pagos Registrados</div>
          <div class="summary-value">${payments.length}</div>
        </div>
        <div class="summary-card cobrado">
          <div class="summary-label">Monto Cobrado</div>
          <div class="summary-value">${fmtSummary(summary.cobrado)}</div>
        </div>
        <div class="summary-card pendiente">
          <div class="summary-label">Monto Pendiente</div>
          <div class="summary-value">${fmtSummary(summary.pendiente)}</div>
        </div>
        <div class="summary-card moroso">
          <div class="summary-label">Monto Moroso</div>
          <div class="summary-value">${fmtSummary(summary.moroso)}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Nº</th>
            <th>Residente</th>
            <th>Torre</th>
            <th>Piso</th>
            <th>Apto</th>
            <th>Tipo</th>
            <th>Método</th>
            <th>Monto (Bs)</th>
            <th>Estado</th>
            <th>Mes</th>
            <th>Vencimiento</th>
            <th>F. Pago</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="footer-totals">
        <div>
          <p style="color: #64748b; font-style: italic; font-size: 10px;">
            Este documento muestra los pagos filtrados en el momento de su exportación.
          </p>
        </div>
        <div class="total-box">
          <div class="total-line">
            <strong>Total Cobrado:</strong> ${fmtSummary(totalCobrado)}
          </div>
          <div class="total-line">
            <strong>Total Pendiente:</strong> ${fmtSummary(totalPendiente)}
          </div>
          <div class="total-line grand-total">
            <strong>Total General:</strong> ${fmtSummary(totalGeneral)}
          </div>
        </div>
      </div>

    </body>
    </html>
  `;
}
