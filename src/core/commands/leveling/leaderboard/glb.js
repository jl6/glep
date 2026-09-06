const { EmbedBuilder } = require('discord.js');
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(process.cwd(), 'database', 'data.db'));

module.exports = {
    name: 'glb',
    description: 'Displays global leveling leaderboard',
    usage: '',
    async execute(msg, args, client) {
        const rows = db.prepare('SELECT user_id, SUM(xp) as total_xp, SUM(messages) as total_msgs FROM user_levels GROUP BY user_id ORDER BY total_xp DESC LIMIT 10').all();
        if (!rows.length) return msg.reply('No global leveling data found.');

        const desc = rows.map((r, i) => `${i + 1}. <@${r.user_id}> - Total XP: ${r.total_xp} | Total Msgs: ${r.total_msgs}`).join('\n');
        const embed = new EmbedBuilder()
            .setTitle('Global Leaderboard')
            .setDescription(desc)
            .setColor(0x2b2d31)
            .setThumbnail(client.user.displayAvatarURL());

        return msg.reply({ embeds: [embed] });
    }
};