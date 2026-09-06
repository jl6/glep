const { PermissionFlagsBits } = require('discord.js');
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(process.cwd(), 'database', 'data.db'));

module.exports = {
    name: 'xpreset',
    description: 'Completely wipes all server leveling progress for a fresh reset',
    async execute(msg, args, client) {
        if (!msg.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return msg.reply('Missing permissions.');
        }

        const conf = args[0]?.toLowerCase();
        if (conf !== 'confirm') {
            return msg.reply('Warning: This will delete all user XP and levels for this server permanently. Run `!xpreset confirm` to proceed.');
        }

        db.prepare('DELETE FROM user_levels WHERE guild_id = ?').run(msg.guild.id);
        return msg.reply('All server leveling progress has been successfully reset.');
    }
};