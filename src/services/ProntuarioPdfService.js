const PDFDocument = require('pdfkit');

async function gerarProntuarioPdf(prontuarioCompleto) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Cabeçalho
    doc.fontSize(18).text('AltClinic — Prontuário Eletrônico', { align: 'center' });
    doc.moveDown();
    doc.fontSize(11).text(`Paciente: ${prontuarioCompleto.paciente_nome}`);
    doc.text(`Profissional: ${prontuarioCompleto.profissional_nome}${prontuarioCompleto.profissional_crm ? ' — CRM: ' + prontuarioCompleto.profissional_crm : ''}`);
    doc.text(`Data: ${prontuarioCompleto.assinado_em ? new Date(prontuarioCompleto.assinado_em).toLocaleString('pt-BR') : new Date(prontuarioCompleto.criado_em).toLocaleString('pt-BR')}`);
    doc.text(`Tipo: ${prontuarioCompleto.tipo_atendimento}`);
    doc.text(`Status: ${prontuarioCompleto.status}`);
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    // Seções
    for (const entrada of (prontuarioCompleto.entradas || [])) {
      doc.fontSize(13).text(
        entrada.secao.replace(/_/g, ' ').toUpperCase(),
        { underline: true }
      );
      const conteudo = entrada.conteudo_json;
      if (typeof conteudo === 'string') {
        doc.fontSize(10).text(conteudo);
      } else {
        doc.fontSize(10).text(JSON.stringify(conteudo, null, 2));
      }
      doc.moveDown();
    }

    // Prescrições
    if (prontuarioCompleto.prescricoes?.length) {
      doc.fontSize(13).text('PRESCRIÇÕES', { underline: true });
      prontuarioCompleto.prescricoes.forEach((p, i) => {
        const linha = [
          `${i + 1}. ${p.medicamento}`,
          p.dose ? `— ${p.dose}` : '',
          p.frequencia ? `${p.frequencia}` : '',
          p.duracao ? `por ${p.duracao}` : '',
          p.via ? `(${p.via})` : '',
        ].filter(Boolean).join(' ');
        doc.fontSize(10).text(linha);
      });
      doc.moveDown();
    }

    // CIDs
    if (prontuarioCompleto.cids?.length) {
      doc.fontSize(13).text('CID-10', { underline: true });
      prontuarioCompleto.cids.forEach((c) => {
        doc.fontSize(10).text(
          `${c.cid_codigo} — ${c.cid_descricao} (${c.tipo} / ${c.status_cid})`
        );
      });
      doc.moveDown();
    }

    doc.end();
  });
}

module.exports = { gerarProntuarioPdf };
