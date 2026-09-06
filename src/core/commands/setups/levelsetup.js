const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(process.cwd(), 'database', 'data.db'));

db.exec(`
    CREATE TABLE IF NOT EXISTS leveling_settings (
        guild_id TEXT PRIMARY KEY,
        enabled INTEGER DEFAULT 0
    );
`);

module.exports = {
    name: 'levelsetup',
    description: 'Toggle the server leveling system on or off',
    async execute(msg, args, client) {
        if (!msg.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return msg.reply('Missing permissions.');
        }

        const conf = db.prepare('SELECT enabled FROM leveling_settings WHERE guild_id = ?').get(msg.guild.id);
        const current = conf ? conf.enabled : 0;

        const embed = new EmbedBuilder()
            .setTitle('Leveling System Configuration')
            .setDescription(`Status: **${current ? 'Enabled' : 'Disabled'}**\nUse the button below to toggle.`);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('level_toggle')
                .setLabel(current ? 'Disable Leveling' : 'Enable Leveling')
                .setStyle(current ? ButtonStyle.Danger : ButtonStyle.Success)
        );

        const reply = await msg.reply({ embeds: [embed], components: [row] });
        const filter = i => i.user.id === msg.author.id;
        const col = reply.createMessageComponentCollector({ filter, time: 60000 });

        col.on('collect', async i => {
            if (!i.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return i.reply({ content: 'Missing permissions.', ephemeral: true });
            }

            if (i.customId === 'level_toggle') {
                const status = db.prepare('SELECT enabled FROM leveling_settings WHERE guild_id = ?').get(msg.guild.id)?.enabled || 0;
                const next = status ? 0 : 1;
                db.prepare('INSERT OR REPLACE INTO leveling_settings (guild_id, enabled) VALUES (?, ?)').run(msg.guild.id, next);

                const updatedEmbed = new EmbedBuilder()
                    .setTitle('Leveling System Configuration')
                    .setDescription(`Status: **${next ? 'Enabled' : 'Disabled'}**\nUse the button below to toggle.`);

                const updatedRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('level_toggle')
                        .setLabel(next ? 'Disable Leveling' : 'Enable Leveling')
                        .setStyle(next ? ButtonStyle.Danger : ButtonStyle.Success)
                );

                await i.update({ embeds: [updatedEmbed], components: [updatedRow] });
            }
        });

        col.on('end', () => reply.edit({ components: [] }).catch(() => {}));
    }
};