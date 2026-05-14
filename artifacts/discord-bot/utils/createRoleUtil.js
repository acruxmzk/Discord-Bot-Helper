const SUPERSCRIPT_MAP = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
};

function toSuperscript(n) {
  return String(n).split('').map(d => SUPERSCRIPT_MAP[d] ?? d).join('');
}

async function createRole(guild, name, color) {
  const existing = guild.roles.cache.find(r => r.name === name);
  if (existing) {
    return { role: existing, created: false };
  }

  const role = await guild.roles.create({
    name,
    color,
    reason: 'Criado pelo bot de administração',
  });

  return { role, created: true };
}

module.exports = { createRole, toSuperscript };
