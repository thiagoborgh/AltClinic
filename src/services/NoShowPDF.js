/**
 * NoShowPDF — geração de PDF do relatório no-show via pdfkit
 */
function buildNoShowPDF(doc, { rows, kpis, inicio, fim }) {
  const logoPath = process.env.TENANT_LOGO_PATH;

  if (logoPath) {
    try { doc.image(logoPath, 50, 45, { width: 80 }); } catch { /* logo opcional */ }
  }
  doc.fontSize(16).font('Helvetica-Bold')
     .text('Relatório de No-Show', 150, 50, { align: 'center' });
  doc.fontSize(10).font('Helvetica')
     .text(`Período: ${inicio} a ${fim}`, { align: 'center' });
  doc.moveDown(2);

  doc.fontSize(12).font('Helvetica-Bold').text('Indicadores do Período');
  doc.moveDown(0.5);
  const kpiRows = [
    ['Total de agendamentos', kpis.total_agendamentos],
    ['Total de no-shows', kpis.total_no_shows],
    ['Taxa de no-show', `${kpis.taxa_no_show_pct}%`],
    ['Ticket médio', `R$ ${kpis.ticket_medio}`],
    ['Impacto financeiro estimado', `R$ ${kpis.impacto_financeiro}`],
    ['Variação vs. mês anterior', `${parseFloat(kpis.variacao_mes_anterior_pct || 0) > 0 ? '+' : ''}${kpis.variacao_mes_anterior_pct}%`],
  ];
  kpiRows.forEach(([label, valor]) => {
    doc.fontSize(10).font('Helvetica-Bold').text(label + ': ', { continued: true })
       .font('Helvetica').text(String(valor ?? ''));
  });
  doc.moveDown(1.5);

  doc.fontSize(12).font('Helvetica-Bold').text('Detalhamento de No-Shows');
  doc.moveDown(0.5);
  const headers = ['Data', 'Horário', 'Paciente', 'Profissional', 'Confirmado', 'Valor'];
  const colWidths = [65, 50, 130, 130, 70, 60];
  let x = 50;
  doc.fontSize(9).font('Helvetica-Bold');
  headers.forEach((h, i) => {
    doc.text(h, x, doc.y, { width: colWidths[i], continued: i < headers.length - 1 });
    x += colWidths[i];
  });
  doc.moveDown(0.3);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.2);

  doc.font('Helvetica').fontSize(8);
  rows.slice(0, 50).forEach(r => {
    if (doc.y > 700) doc.addPage();
    x = 50;
    const cols = [
      r.data, r.horario, r.paciente_nome, r.profissional_nome,
      r.confirmado, `R$ ${r.valor_agendado}`,
    ];
    cols.forEach((c, i) => {
      doc.text(String(c ?? ''), x, doc.y, {
        width: colWidths[i],
        continued: i < cols.length - 1,
        ellipsis: true,
      });
      x += colWidths[i];
    });
    doc.moveDown(0.4);
  });

  if (rows.length > 50) {
    doc.moveDown(0.5).fontSize(8)
       .text(`... e mais ${rows.length - 50} registros. Exporte em CSV para a listagem completa.`);
  }
}

module.exports = { buildNoShowPDF };
