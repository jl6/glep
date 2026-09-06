const { EmbedBuilder } = require('discord.js');
const Database = require('better-sqlite3');
const path = require('path');

const dbRewards = new Database(path.join(process.cwd(), 'database', 'data.db'));

module.exports = {
    name: 'rewards',
    description: 'Displays all level role rewards configured for this server',
    async execute(msg, args, client) {
        if (!msg.guild) return msg.reply('This command can only be used in a server.');

        const rewards = dbRewards.prepare('SELECT level, role_id FROM level_rewards WHERE guild_id = ? ORDER BY level ASC').all(msg.guild.id);
        if (!rewards.length) return msg.reply('No level role rewards configured.');

        const desc = rewards.map(r => `Level ${r.level} -> <@&${r.role_id}>`).join('\n');
        const embed = new EmbedBuilder()
            .setTitle(`Server Level Rewards: ${msg.guild.name}`)
            .setDescription(desc)
            .setColor(0x2b2d31)
            .setThumbnail(client.user.displayAvatarURL());

        return msg.reply({ embeds: [embed] });
    }
};

