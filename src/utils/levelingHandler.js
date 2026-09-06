const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(process.cwd(), 'database', 'data.db'));

db.exec(`
    CREATE TABLE IF NOT EXISTS guild_settings (guild_id TEXT PRIMARY KEY, xp_multiplier REAL DEFAULT 1.0);
    CREATE TABLE IF NOT EXISTS leveling_settings (guild_id TEXT PRIMARY KEY, enabled INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS user_levels (user_id TEXT, guild_id TEXT, xp INTEGER, level INTEGER, messages INTEGER, PRIMARY KEY (user_id, guild_id));
    CREATE TABLE IF NOT EXISTS level_rewards (guild_id TEXT, level INTEGER, role_id TEXT, PRIMARY KEY (guild_id, level));
`);

try { db.exec(`ALTER TABLE guild_settings ADD COLUMN xp_multiplier REAL DEFAULT 1.0;`); } catch (err) {}

const calcXp = lvl => Math.floor(150 * Math.pow(1.25, lvl));

module.exports = async (msg) => {
    if (!msg.guild || msg.author.bot) return;

    const conf = db.prepare('SELECT enabled FROM leveling_settings WHERE guild_id = ?').get(msg.guild.id);
    if (!conf || !conf.enabled) return;

    const uid = msg.author.id;
    const gid = msg.guild.id;

    let row = db.prepare('SELECT xp, level, messages FROM user_levels WHERE user_id = ? AND guild_id = ?').get(uid, gid);
    if (!row) {
        db.prepare('INSERT INTO user_levels (user_id, guild_id, xp, level, messages) VALUES (?, ?, 0, 0, 0)').run(uid, gid);
        row = { xp: 0, level: 0, messages: 0 };
    }

    const boost = db.prepare('SELECT xp_multiplier FROM guild_settings WHERE guild_id = ?').get(gid);
    const mult = boost ? boost.xp_multiplier : 1.0;

    const earned = Math.floor((Math.random() * 15 + 10) * mult);
    let xp = row.xp + earned;
    let lvl = row.level;
    const msgs = row.messages + 1;

    const req = calcXp(lvl);
    if (xp >= req) {
        xp -= req;
        lvl++;

        const rew = db.prepare('SELECT role_id FROM level_rewards WHERE guild_id = ? AND level = ?').get(gid, lvl);
        if (rew) {
            msg.guild.members.fetch(uid).then(m => m && m.roles.add(rew.role_id)).catch(() => {});
        }

        msg.channel.send(`User <@${uid}> reached level ${lvl}.`).catch(() => {});
    }

    db.prepare('UPDATE user_levels SET xp = ?, level = ?, messages = ? WHERE user_id = ? AND guild_id = ?').run(xp, lvl, msgs, uid, gid);
};