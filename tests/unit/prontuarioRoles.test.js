const { requireProntuarioRole } = require('../../src/middleware/prontuarioRoles');

function mockReq(role) { return { user: { role } }; }
function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('requireProntuarioRole', () => {
  it('permite medico ver prontuario', () => {
    const req = mockReq('medico');
    const res = mockRes();
    const next = jest.fn();
    requireProntuarioRole('ver')(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('bloqueia recepcionista de ver prontuario', () => {
    const req = mockReq('recepcionista');
    const res = mockRes();
    requireProntuarioRole('ver')(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('bloqueia tecnico de assinar registro', () => {
    const req = mockReq('tecnico');
    const res = mockRes();
    requireProntuarioRole('assinar')(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('retorna 401 sem user', () => {
    const req = { user: null };
    const res = mockRes();
    requireProntuarioRole('ver')(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
