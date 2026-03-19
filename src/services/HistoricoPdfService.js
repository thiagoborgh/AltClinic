const PDFDocument = require('pdfkit');

async function gerarHistoricoPdf(paciente, eventos) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(16).text('AltClinic — Histórico do Paciente', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11).text(`Paciente: ${paciente.nome}`);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    eventos.forEach((e) => {
      const data = new Date(e.criado_em).toLocaleString('pt-BR');
      doc.fontSize(9)
         .fillColor('#555')
         .text(
           `[${data}]  ${e.tipo_evento.replace(/_/g, ' ').toUpperCase()}  (${e.categoria})`,
           { continued: false }
         );
      doc.fontSize(10)
         .fillColor('#000')
         .text(e.descricao, { indent: 20 });
      doc.moveDown(0.3);
    });

    doc.end();
  });
}

module.exports = { gerarHistoricoPdf };
