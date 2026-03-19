// Re-exporta validarCpf com o nome esperado pelo TDD de profissionais
const { validarCpf, formatarCpf } = require('./validarCpf');

module.exports = { validarCPF: validarCpf, formatarCPF: formatarCpf };
