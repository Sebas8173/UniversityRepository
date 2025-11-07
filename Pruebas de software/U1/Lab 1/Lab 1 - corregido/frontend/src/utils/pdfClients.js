// src/utils/pdfClients.js
// Helpers for generating client PDFs. These are pure helpers that accept a jsPDF
// instance and necessary parameters so they can be tested and reused.
export function drawTableHeader(doc, colPositions, pageWidth, margin, y) {
  doc.setFillColor(41, 128, 185);
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');

  doc.setFontSize(10);
  doc.setTextColor(255);
  doc.setFont('helvetica', 'bold');

  const headers = ['#', 'ID', 'Nombre Completo', 'Email', 'Teléfono', 'Dirección'];
  headers.forEach((header, index) => {
    doc.text(header, colPositions[index] + 2, y + 6);
  });

  return y + 8;
}

export function drawTableRow(doc, client, index, colPositions, colWidths, rowHeight, y, isOdd = false) {
  // Alternate row colors
  if (isOdd) {
    doc.setFillColor(245, 245, 245);
    doc.rect(colPositions[0], y, (colPositions[colPositions.length - 1] + colWidths[colWidths.length - 1]) - colPositions[0], rowHeight, 'F');
  }

  doc.setTextColor(40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const rowData = [
    (index + 1).toString(),
    client.id_client?.toString() || 'N/A',
    `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Sin nombre',
    client.email || 'No especificado',
    client.phone || 'No especificado',
    client.address || 'No especificado'
  ];

  rowData.forEach((text, colIndex) => {
    const maxWidth = colWidths[colIndex] - 4;
    const lines = doc.splitTextToSize(text, maxWidth);

    const maxLines = Math.floor((rowHeight - 4) / 4);
    const linesToShow = lines.slice(0, maxLines);

    linesToShow.forEach((line, lineIndex) => {
      doc.text(line, colPositions[colIndex] + 2, y + 6 + (lineIndex * 4));
    });
  });

  // Draw row border
  doc.setDrawColor(200);
  doc.rect(colPositions[0], y, (colPositions[colPositions.length - 1] + colWidths[colWidths.length - 1]) - colPositions[0], rowHeight);

  return y + rowHeight;
}

export function checkPageBreak(doc, currentY, itemHeight, pageHeight) {
  if (currentY + itemHeight > pageHeight - 30) {
    doc.addPage();
    return 25; // Reset Y position for new page
  }
  return currentY;
}

export function addFooter(doc, margin, pageWidth, pageHeight) {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount}`, margin, pageHeight - 10);
    doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, pageWidth - 80, pageHeight - 10);
  }
}
