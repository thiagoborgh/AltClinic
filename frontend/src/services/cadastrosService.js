import api from './api';

const cadastrosService = {

  // ── PROCEDIMENTOS ────────────────────────────────────────────────────────────

  async getProcedimentos() {
    const res = await api.get('/cadastros/procedimentos');
    return res.data.data || [];
  },

  async criarProcedimento(data) {
    const res = await api.post('/cadastros/procedimentos', data);
    return res.data.data;
  },

  async atualizarProcedimento(id, data) {
    const res = await api.put(`/cadastros/procedimentos/${id}`, data);
    return res.data.data;
  },

  async deletarProcedimento(id) {
    await api.delete(`/cadastros/procedimentos/${id}`);
  },

  // ── CONVÊNIOS ────────────────────────────────────────────────────────────────

  async getConvenios() {
    const res = await api.get('/cadastros/convenios');
    return res.data.data || [];
  },

  async criarConvenio(data) {
    const res = await api.post('/cadastros/convenios', data);
    return res.data.data;
  },

  async atualizarConvenio(id, data) {
    const res = await api.put(`/cadastros/convenios/${id}`, data);
    return res.data.data;
  },

  async deletarConvenio(id) {
    await api.delete(`/cadastros/convenios/${id}`);
  },

  // ── USUÁRIOS (funcionários) ──────────────────────────────────────────────────

  async getUsuarios() {
    const res = await api.get('/cadastros/usuarios');
    return res.data.data || [];
  },

  async criarUsuario(data) {
    const res = await api.post('/cadastros/usuarios', data);
    return res.data.data;
  },

  async atualizarUsuario(id, data) {
    const res = await api.put(`/cadastros/usuarios/${id}`, data);
    return res.data.data;
  },

  async deletarUsuario(id) {
    await api.delete(`/cadastros/usuarios/${id}`);
  },
};

export default cadastrosService;
