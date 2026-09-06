const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

const dir = path.join(process.cwd(), 'database');
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(path.join(dir, 'data.db'));

module.exports = {
    name: 'help',
    description: 'Displays available commands or specific command info.',
    usage: '',
    async execute(msg, args, client) {
        let prefix = process.env.PREFIX || '!';

        if (msg.guild) {
            const row = db.prepare('SELECT prefix FROM guild_settings WHERE guild_id = ?').get(msg.guild.id);
            if (row?.prefix) prefix = row.prefix;
        }

        const target = args[0]?.toLowerCase();
        if (target) {
            const cmd = client.commands.get(target);
            if (!cmd) return msg.reply('Command not found.');

            const usage = cmd.usage ? `${prefix}${cmd.name} ${cmd.usage}` : `${prefix}${cmd.name}`;
            const embed = new EmbedBuilder()
                .setTitle(`Command: ${cmd.name}`)
                .setDescription(cmd.description || 'No description provided.')
                .setThumbnail(client.user.displayAvatarURL())
                .addFields({ name: 'Usage', value: `\`\`\`text\n${usage}\n\`\`\`` });

            return msg.reply({ embeds: [embed] });
        }

        const groups = {};
        client.commands.forEach(cmd => {
            const cat = cmd.category || 'General';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(cmd.name);
        });

        const embed = new EmbedBuilder()
            .setTitle('Command Directory')
            .setDescription(`Prefix: \`${prefix}\`\nUse \`${prefix}help [command]\` for details.`)
            .setThumbnail(client.user.displayAvatarURL());

        for (const [cat, names] of Object.entries(groups)) {
            const list = names.map(n => `\`${n}\``).join(', ');
            embed.addFields({ name: cat.toUpperCase(), value: list || 'None' });
        }

        return msg.reply({ embeds: [embed] });
    }
};