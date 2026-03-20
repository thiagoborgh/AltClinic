/**
 * ReceitaPDF — geração de PDF do relatório de receita via pdfkit
 */

function renderTableHeader(doc, headers, colWidths, startX) {
  let x = startX;
  doc.fontSize(9).font('Helvetica-Bold');
  headers.forEach((h, i) => {
    doc.text(h, x, doc.y, { width: colWidths[i], continued: i < headers.length - 1 });
    x += colWidths[i];
  });
  doc.moveDown(0.3);
  doc.moveTo(startX, doc.y).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), doc.y).stroke();
  doc.moveDown(0.2);
}

function renderTableRow(doc, cols, colWidths, startX) {
  if (doc.y > 700) doc.addPage();
  let x = startX;
  doc.font('Helvetica').fontSize(8);
  cols.forEach((c, i) => {
    doc.text(String(c ?? ''), x, doc.y, {
      width: colWidths[i],
      continued: i < cols.length - 1,
      ellipsis: true,
    });
    x += colWidths[i];
  });
  doc.moveDown(0.4);
}

function buildReceitaPDF(doc, { rows, kpis, porProfissional, porProcedimento, aging, inicio, fim }) {
  const logoPath = process.env.TENANT_LOGO_PATH;

  if (logoPath) {
    try { doc.image(logoPath, 50, 45, { width: 80 }); } catch { /* logo opcional */ }
  }
  doc.fontSize(16).font('Helvetica-Bold')
     .text('Relatório de Receita', 150, 50, { align: 'center' });
  doc.fontSize(10).font('Helvetica')
     .text(`Período: ${inicio} a ${fim}`, { align: 'center' });
  doc.moveDown(2);

  // KPIs
  doc.fontSize(12).font('Helvetica-Bold').text('Indicadores do Período');
  doc.moveDown(0.5);
  const kpiRows = [
    ['Receita bruta',           `R$ ${kpis.receita_bruta ?? 0}`],
    ['Receita líquida',         `R$ ${kpis.receita_liquida ?? 0}`],
    ['Ticket médio',            `R$ ${kpis.ticket_medio ?? 0}`],
    ['Total de atendimentos',   kpis.total_atendimentos ?? 0],
    ['Variação vs. mês anterior', `${parseFloat(kpis.var_mes_anterior_pct || 0) > 0 ? '+' : ''}${kpis.var_mes_anterior_pct ?? 0}%`],
    ['Variação vs. ano anterior', `${parseFloat(kpis.var_ano_anterior_pct || 0) > 0 ? '+' : ''}${kpis.var_ano_anterior_pct ?? 0}%`],
    ['Taxa de inadimplência',   `${kpis.taxa_inadimplencia_pct ?? 0}%`],
    ['Faturas em atraso',       `${kpis.faturas_em_atraso ?? 0} de ${kpis.total_faturas ?? 0}`],
  ];
  kpiRows.forEach(([label, valor]) => {
    doc.fontSize(10).font('Helvetica-Bold').text(label + ': ', { continued: true })
       .font('Helvetica').text(String(valor));
  });
  doc.moveDown(1.5);

  // Ranking de Profissionais
  if (porProfissional && porProfissional.length > 0) {
    doc.fontSize(12).font('Helvetica-Bold').text('Receita por Profissional');
    doc.moveDown(0.5);
    const profHeaders  = ['Profissional', 'Atendimentos', 'Receita (R$)', 'Ticket Médio', '% Total'];
    const profWidths   = [150, 80, 90, 90, 60];
    renderTableHeader(doc, profHeaders, profWidths, 50);
    porProfissional.slice(0, 10).forEach(p => {
      renderTableRow(doc, [
        p.profissional_nome,
        p.total_atendimentos,
        p.receita_total,
        p.ticket_medio,
        `${p.pct_medio_do_total}%`,
      ], profWidths, 50);
    });
    doc.moveDown(1);
  }

  // Ranking de Procedimentos
  if (porProcedimento && porProcedimento.length > 0) {
    if (doc.y > 600) doc.addPage();
    doc.fontSize(12).font('Helvetica-Bold').text('Receita por Procedimento');
    doc.moveDown(0.5);
    const procHeaders = ['Procedimento', 'Qtd', 'Receita (R$)', 'Ticket Médio', 'Tendência 3m'];
    const procWidths  = [160, 40, 90, 90, 90];
    renderTableHeader(doc, procHeaders, procWidths, 50);
    porProcedimento.slice(0, 10).forEach(p => {
      renderTableRow(doc, [
        p.procedimento_nome,
        p.quantidade_total,
        p.receita_total,
        p.ticket_medio,
        p.tendencia_3m != null ? `R$ ${p.tendencia_3m}` : 'N/D',
      ], procWidths, 50);
    });
    doc.moveDown(1);
  }

  // Inadimplência por faixa
  if (aging && aging.length > 0) {
    if (doc.y > 600) doc.addPage();
    doc.fontSize(12).font('Helvetica-Bold').text('Inadimplência por Faixa de Atraso');
    doc.moveDown(0.5);
    const agingHeaders = ['Faixa', 'Qtd Faturas', 'Valor Total (R$)', 'Ticket Médio', 'Dias Atraso Médio'];
    const agingWidths  = [90, 80, 110, 110, 105];
    renderTableHeader(doc, agingHeaders, agingWidths, 50);
    aging.forEach(a => {
      renderTableRow(doc, [
        a.faixa_aging,
        a.quantidade,
        a.valor_total,
        a.ticket_medio_inadimplente,
        a.dias_atraso_medio,
      ], agingWidths, 50);
    });
    doc.moveDown(1);
  }

  // Detalhamento de pagamentos
  if (rows && rows.length > 0) {
    if (doc.y > 550) doc.addPage();
    doc.fontSize(12).font('Helvetica-Bold').text('Detalhamento de Pagamentos');
    doc.moveDown(0.5);
    const detHeaders = ['Data', 'Paciente', 'Profissional', 'Procedimento', 'Valor (R$)', 'Forma'];
    const detWidths  = [60, 110, 100, 110, 70, 55];
    renderTableHeader(doc, detHeaders, detWidths, 25);
    rows.slice(0, 50).forEach(r => {
      renderTableRow(doc, [
        r.data_pagamento ? String(r.data_pagamento).slice(0, 10) : '',
        r.paciente_nome,
        r.profissional_nome,
        r.procedimento_nome,
        r.valor,
        r.forma_pagamento,
      ], detWidths, 25);
    });
    if (rows.length > 50) {
      doc.moveDown(0.5).fontSize(8)
         .text(`... e mais ${rows.length - 50} registros. Exporte em CSV para a listagem completa.`);
    }
  }
}

module.exports = { buildReceitaPDF };
