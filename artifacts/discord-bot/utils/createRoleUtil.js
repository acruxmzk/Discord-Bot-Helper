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

module.exports = { createRole };
