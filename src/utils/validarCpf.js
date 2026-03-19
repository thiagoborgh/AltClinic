function validarCpf(cpf) {
  const n = cpf.replace(/\D/g, '');
  if (n.length !== 11) return false;
  if (/^(\d)\1+$/.test(n)) return false; // todos iguais: 111.111.111-11

  const soma = (limite) =>
    n.slice(0, limite - 1)
     .split('')
     .reduce((acc, d, i) => acc + parseInt(d) * (limite - i), 0);

  const digito = (s) => { const r = (s * 10) % 11; return r >= 10 ? 0 : r; };

  return digito(soma(10)) === parseInt(n[9]) &&
         digito(soma(11)) === parseInt(n[10]);
}

function formatarCpf(cpf) {
  const n = cpf.replace(/\D/g, '');
  return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

module.exports = { validarCpf, formatarCpf };
