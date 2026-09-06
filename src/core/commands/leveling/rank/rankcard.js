const { PermissionFlagsBits } = require('discord.js');
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(process.cwd(), 'database', 'data.db'));

db.exec(`
    CREATE TABLE IF NOT EXISTS user_preferences (
        user_id TEXT,
        guild_id TEXT,
        bar_color TEXT,
        PRIMARY KEY (user_id, guild_id)
    );
`);

module.exports = {
    name: 'rankcard',
    description: 'Customize your rank card progress bar accent color',
    usage: '[hex_color]',
    async execute(msg, args, client) {
        if (!msg.guild) return msg.reply('This command can only be used in a server.');

        const col = args[0];
        if (!col || !/^#([0-9A-F]{3}){1,2}$/i.test(col)) {
            return msg.reply('Usage: !rankcard [#HEXCOLOR] (Example: !rankcard #5865f2)');
        }

        db.prepare('INSERT OR REPLACE INTO user_preferences (user_id, guild_id, bar_color) VALUES (?, ?, ?)').run(msg.author.id, msg.guild.id, col);
        return msg.reply(`Rank card accent color updated to **${col}**.`);
    }
};