/**
 * Parse inteligente de uma linha de jogador.
 * Detecta automaticamente UID (sequência de dígitos), @TikTok e nickname — em qualquer ordem.
 *
 * Formatos aceitos (todos funcionam):
 *   Nick | 1234567890 | @tiktok
 *   1234567890 | Nick | @tiktok
 *   Nick 1234567890 @tiktok
 *   @tiktok Nick 1234567890
 *   Nick1234567890@tiktok
 */
function parsePlayer(raw) {
  if (!raw?.trim()) return null;
  const text = raw.trim();

  // ── UID: primeira sequência de 6-20 dígitos ───────────────────────────────
  const uidMatch = text.match(/\b(\d{6,20})\b/);
  const uid      = uidMatch ? uidMatch[1] : '—';

  // ── TikTok: @handle (letras, números, ponto, underline) ───────────────────
  const tiktokMatch = text.match(/@[\w.]+/);
  const tiktok      = tiktokMatch ? tiktokMatch[0] : '—';

  // ── Nickname: o que sobra depois de remover UID e @TikTok ────────────────
  let nome = text;
  if (uidMatch)    nome = nome.replace(uidMatch[0], '');
  if (tiktokMatch) nome = nome.replace(tiktokMatch[0], '');
  nome = nome
    .replace(/[|,\-]+/g, ' ')  // remove separadores comuns
    .replace(/\s{2,}/g, ' ')   // colapsa espaços múltiplos
    .trim();

  if (!nome) nome = '—';

  return { nome, uid, tiktok };
}

module.exports = { parsePlayer };
