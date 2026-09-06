const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(process.cwd(), 'database', 'data.db'));

db.exec(`
    CREATE TABLE IF NOT EXISTS guild_settings (
        guild_id TEXT PRIMARY KEY,
        xp_multiplier REAL DEFAULT 1.0
    );
`);

module.exports = {
    name: 'xpboost',
    description: 'Configure server XP multipliers using interactive buttons',
    async execute(msg, args, client) {
        if (!msg.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return msg.reply('Missing permissions.');
        }

        const getMult = () => db.prepare('SELECT xp_multiplier FROM guild_settings WHERE guild_id = ?').get(msg.guild.id)?.xp_multiplier || 1.0;
        const current = getMult();

        const buildEmbed = m => new EmbedBuilder()
            .setTitle('Server XP Boost Configuration')
            .setDescription(`Current Multiplier: ${m}x\nSelect a new value below:`)
            .setColor(0x2b2d31);

        const buildRow = m => new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('boost_1').setLabel('1x').setStyle(m === 1.0 ? ButtonStyle.Primary : ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('boost_1.5').setLabel('1.5x').setStyle(m === 1.5 ? ButtonStyle.Primary : ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('boost_2').setLabel('2x').setStyle(m === 2.0 ? ButtonStyle.Primary : ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('boost_3').setLabel('3x').setStyle(m === 3.0 ? ButtonStyle.Primary : ButtonStyle.Secondary)
        );

        const reply = await msg.reply({ embeds: [buildEmbed(current)], components: [buildRow(current)] });
        const filter = i => i.user.id === msg.author.id;
        const col = reply.createMessageComponentCollector({ filter, time: 60000 });

        col.on('collect', async i => {
            if (!i.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return i.reply({ content: 'Missing permissions.', ephemeral: true });
            }

            let newMult = 1.0;
            if (i.customId === 'boost_1') newMult = 1.0;
            if (i.customId === 'boost_1.5') newMult = 1.5;
            if (i.customId === 'boost_2') newMult = 2.0;
            if (i.customId === 'boost_3') newMult = 3.0;

            db.prepare('INSERT OR REPLACE INTO guild_settings (guild_id, xp_multiplier) VALUES (?, ?)').run(msg.guild.id, newMult);
            await i.update({ embeds: [buildEmbed(newMult)], components: [buildRow(newMult)] });
        });

        col.on('end', () => reply.edit({ components: [] }).catch(() => {}));
    }
};