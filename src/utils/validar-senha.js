// src/utils/validar-senha.js
const SENHA_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

function validarSenha(senha) {
  if (!senha || typeof senha !== 'string') {
    return { valida: false, motivo: 'Senha é obrigatória' };
  }
  if (!SENHA_REGEX.test(senha)) {
    return {
      valida: false,
      motivo: 'Senha deve ter no mínimo 8 caracteres, 1 letra maiúscula e 1 número',
    };
  }
  return { valida: true };
}

module.exports = { validarSenha };
