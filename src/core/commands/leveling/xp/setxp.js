const { PermissionFlagsBits } = require('discord.js');
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(process.cwd(), 'database', 'data.db'));

module.exports = {
    name: 'setxp',
    description: 'Manually adjust or reset a user XP and level',
    usage: '@user [add | set | reset] [amount]',
    devOnly: true,

    async execute(msg, args, client) {
        if (!msg.member.permissions.has(PermissionFlagsBits.ManageGuild)) return msg.reply('Missing permissions.');

        const target = msg.mentions.users.first();
        const action = args[1]?.toLowerCase();
        const amt = parseInt(args[2]);

        if (!target || !['add', 'set', 'reset'].includes(action)) {
            return msg.reply('Usage: !setxp <@user> <add/set/reset> [amount]');
        }

        if (action !== 'reset' && isNaN(amt)) {
            return msg.reply('Provide a valid numeric amount for XP.');
        }

        const gid = msg.guild.id;
        const uid = target.id;

        let row = db.prepare('SELECT xp, level, messages FROM user_levels WHERE user_id = ? AND guild_id = ?').get(uid, gid);
        if (!row) {
            db.prepare('INSERT INTO user_levels (user_id, guild_id, xp, level, messages) VALUES (?, ?, 0, 0, 0)').run(uid, gid);
            row = { xp: 0, level: 0, messages: 0 };
        }

        let xp = row.xp;
        let lvl = row.level;

        if (action === 'reset') {
            db.prepare('UPDATE user_levels SET xp = 0, level = 0 WHERE user_id = ? AND guild_id = ?').run(uid, gid);
            return msg.reply(`Reset XP and level for <@${uid}>.`);
        }

        if (action === 'add') xp += amt;
        else if (action === 'set') xp = amt;

        if (xp < 0) xp = 0;

        db.prepare('UPDATE user_levels SET xp = ?, level = ? WHERE user_id = ? AND guild_id = ?').run(xp, lvl, uid, gid);
        return msg.reply(`Updated <@${uid}> stats: XP is now ${xp} at level ${lvl}.`);
    }
};