const { EmbedBuilder } = require('discord.js');
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(process.cwd(), 'database', 'data.db'));

module.exports = {
    name: 'lb',
    description: 'Displays server leveling leaderboard',
    usage: '',
    async execute(msg, args, client) {
        if (!msg.guild) return msg.reply('This command can only be used in a server.');

        const rows = db.prepare('SELECT user_id, xp, level, messages FROM user_levels WHERE guild_id = ? ORDER BY xp DESC LIMIT 10').all(msg.guild.id);
        if (!rows.length) return msg.reply('No leveling data found for this server.');

        const desc = rows.map((r, i) => `${i + 1}. <@${r.user_id}> - Level ${r.level} | XP: ${r.xp} | Msgs: ${r.messages}`).join('\n');
        const embed = new EmbedBuilder()
            .setTitle(`Server Leaderboard: ${msg.guild.name}`)
            .setDescription(desc)
            .setColor(0x2b2d31)
            .setThumbnail(client.user.displayAvatarURL());

        return msg.reply({ embeds: [embed] });
    }
};