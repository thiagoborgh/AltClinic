/**
 * EFIBankService — integração com EFI Bank API para geração de cobranças Pix
 * OAuth2 + mTLS em produção, sem mTLS em homologação
 */
const https   = require('https');
const fs      = require('fs');
const crypto  = require('crypto');
const axios   = require('axios');
const pool    = require('../database/postgres');
const { schemaFromSlug } = require('./CrmScoreService');

// ── Cache de tokens por tenant ────────────────────────────────────────────────
const tokenCache = new Map(); // slug → { token, expiresAt }

// ── Criptografia AES-256-GCM ──────────────────────────────────────────────────
function encrypt(plaintext) {
  const key = Buffer.from(process.env.ENCRYPTION_KEY || '0'.repeat(64), 'hex');
  const iv  = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc    = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag    = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
}

function decrypt(ciphertext) {
  const key  = Buffer.from(process.env.ENCRYPTION_KEY || '0'.repeat(64), 'hex');
  const [ivHex, tagHex, encHex] = ciphertext.split(':');
  const iv      = Buffer.from(ivHex, 'hex');
  const tag     = Buffer.from(tagHex, 'hex');
  const enc     = Buffer.from(encHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

// ── Buscar config do tenant ───────────────────────────────────────────────────
async function getPixConfig(tenantId, tenantSlug) {
  const schema = schemaFromSlug(tenantSlug);
  const { rows } = await pool.query(
    `SELECT * FROM "${schema}".pix_config WHERE tenant_id = $1 AND ativo = true`,
    [tenantId]
  );
  if (!rows.length) throw new Error('Configuração Pix não encontrada para este tenant');
  const cfg = rows[0];
  return {
    ...cfg,
    client_id:     decrypt(cfg.client_id_enc),
    client_secret: decrypt(cfg.client_secret_enc),
  };
}

// ── Base URL por ambiente ─────────────────────────────────────────────────────
function baseUrl(ambiente) {
  return ambiente === 'producao'
    ? 'https://pix.api.efipay.com.br'
    : 'https://pix-h.api.efipay.com.br';
}

// ── HTTPS Agent com mTLS (só produção) ───────────────────────────────────────
function makeAgent(ambiente) {
  if (ambiente !== 'producao') return undefined;
  const certPath = process.env.EFI_PIX_CERT_PATH;
  const certPass = process.env.EFI_PIX_CERT_PASS;
  if (!certPath || !fs.existsSync(certPath)) return undefined;
  return new https.Agent({ pfx: fs.readFileSync(certPath), passphrase: certPass });
}

// ── Obter Access Token (com cache) ───────────────────────────────────────────
async function getAccessToken(tenantId, tenantSlug) {
  const cached = tokenCache.get(tenantSlug);
  if (cached && cached.expiresAt > Date.now() + 300_000) return cached.token;

  const config = await getPixConfig(tenantId, tenantSlug);
  const agent  = makeAgent(config.ambiente);

  const res = await axios.post(
    `${baseUrl(config.ambiente)}/oauth/token`,
    'grant_type=client_credentials',
    {
      httpsAgent: agent,
      auth: { username: config.client_id, password: config.client_secret },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 5000,
    }
  );

  const { access_token, expires_in } = res.data;
  tokenCache.set(tenantSlug, { token: access_token, expiresAt: Date.now() + expires_in * 1000 });
  return access_token;
}

// ── Criar cobrança Pix dinâmica ───────────────────────────────────────────────
async function criarCobranca({ tenantId, tenantSlug, txid, valor, paciente, fatura, expiracao }) {
  const config = await getPixConfig(tenantId, tenantSlug);
  const token  = await getAccessToken(tenantId, tenantSlug);
  const agent  = makeAgent(config.ambiente);

  const payload = {
    calendario: { expiracao },
    devedor: { nome: paciente.nome || 'Paciente', cpf: paciente.cpf || '00000000000' },
    valor: { original: valor.toFixed(2) },
    chave: config.chave_pix,
    solicitacaoPagador: `Fatura ${fatura.numero} - ${paciente.nome}`,
    infoAdicionais: [
      { nome: 'Fatura', valor: fatura.numero },
    ],
  };

  const res = await axios.put(
    `${baseUrl(config.ambiente)}/v2/cob/${txid}`,
    payload,
    {
      httpsAgent: agent,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      timeout: 8000,
    }
  );

  return res.data; // { txid, status, pixCopiaECola, loc: { id } }
}

// ── Gerar imagem QR Code ──────────────────────────────────────────────────────
async function gerarQRCode({ tenantId, tenantSlug, locId }) {
  const config = await getPixConfig(tenantId, tenantSlug);
  const token  = await getAccessToken(tenantId, tenantSlug);
  const agent  = makeAgent(config.ambiente);

  const res = await axios.get(
    `${baseUrl(config.ambiente)}/v2/loc/${locId}/qrcode`,
    {
      httpsAgent: agent,
      headers: { Authorization: `Bearer ${token}` },
      timeout: 8000,
    }
  );

  return res.data.imagemQrcode; // "data:image/png;base64,..."
}

// ── Consultar cobrança (fallback polling) ─────────────────────────────────────
async function consultarCobranca({ tenantId, tenantSlug, txid }) {
  const config = await getPixConfig(tenantId, tenantSlug);
  const token  = await getAccessToken(tenantId, tenantSlug);
  const agent  = makeAgent(config.ambiente);

  const res = await axios.get(
    `${baseUrl(config.ambiente)}/v2/cob/${txid}`,
    {
      httpsAgent: agent,
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000,
    }
  );

  return res.data.status; // 'ATIVA' | 'CONCLUIDA' | 'REMOVIDA_PELO_USUARIO_RECEBEDOR' | 'REMOVIDA_PELO_PSP'
}

// ── Registrar webhook no EFI Bank ─────────────────────────────────────────────
async function registrarWebhook({ tenantId, tenantSlug, webhookUrl }) {
  const config = await getPixConfig(tenantId, tenantSlug);
  const token  = await getAccessToken(tenantId, tenantSlug);
  const agent  = makeAgent(config.ambiente);

  await axios.put(
    `${baseUrl(config.ambiente)}/v2/webhook/${encodeURIComponent(config.chave_pix)}`,
    { webhookUrl },
    {
      httpsAgent: agent,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      timeout: 8000,
    }
  );
}

module.exports = { encrypt, decrypt, getPixConfig, getAccessToken, criarCobranca, gerarQRCode, consultarCobranca, registrarWebhook };
