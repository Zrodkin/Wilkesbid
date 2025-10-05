// lib/export-utils.ts
interface ExportItem {
  id: string;
  title?: string;
  service?: string;
  honor?: string;
  description?: string;
  current_bid: number;
  current_bidder?: {
    full_name: string;
    email: string;
  } | null;
  is_paid?: boolean;
}

export function exportToCSV(items: ExportItem[], filename: string) {
  const headers = ['Title', 'Service', 'Honor', 'Current Bid', 'Bidder Name', 'Bidder Email', 'Paid Status'];
  
  const rows = items.map(item => [
    item.title || '',
    item.service || '',
    item.honor || '',
    item.current_bid.toString(),
    item.current_bidder?.full_name || 'No bids',
    item.current_bidder?.email || '',
    item.is_paid ? 'Paid' : 'Unpaid'
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

export function exportToExcel(items: ExportItem[], filename: string) {
  // Simple Excel export using HTML table method
  const headers = ['Title', 'Service', 'Honor', 'Current Bid', 'Bidder Name', 'Bidder Email', 'Paid Status'];
  
  const rows = items.map(item => [
    item.title || '',
    item.service || '',
    item.honor || '',
    item.current_bid.toString(),
    item.current_bidder?.full_name || 'No bids',
    item.current_bidder?.email || '',
    item.is_paid ? 'Paid' : 'Unpaid'
  ]);

  let excelContent = '<table><thead><tr>';
  headers.forEach(header => {
    excelContent += `<th>${header}</th>`;
  });
  excelContent += '</tr></thead><tbody>';
  
  rows.forEach(row => {
    excelContent += '<tr>';
    row.forEach(cell => {
      excelContent += `<td>${cell}</td>`;
    });
    excelContent += '</tr>';
  });
  
  excelContent += '</tbody></table>';

  const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

export function exportToPDF(items: ExportItem[], filename: string) {
  // Create a printable HTML page
  const headers = ['Title', 'Service', 'Honor', 'Current Bid', 'Bidder Name', 'Bidder Email', 'Paid Status'];
  
  const rows = items.map(item => [
    item.title || '',
    item.service || '',
    item.honor || '',
    `$${item.current_bid.toLocaleString()}`,
    item.current_bidder?.full_name || 'No bids',
    item.current_bidder?.email || '',
    item.is_paid ? 'Paid' : 'Unpaid'
  ]);

  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Auction Data</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #C9A961; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #C9A961; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
      </style>
    </head>
    <body>
      <h1>Auction Data Export</h1>
      <p>Generated on: ${new Date().toLocaleString()}</p>
      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              ${row.map(cell => `<td>${cell}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const printWindow = window.open('', '', 'height=600,width=800');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }
}