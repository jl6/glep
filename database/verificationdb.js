const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(process.cwd(), 'database', 'data.db'));

db.prepare(`
    CREATE TABLE IF NOT EXISTS verification_settings (
        guild_id TEXT PRIMARY KEY,
        role_id TEXT,
        channel_id TEXT,
        log_channel_id TEXT
    )
`).run();

const getVerify = db.prepare('SELECT * FROM verification_settings WHERE guild_id = ?');
const setVerify = db.prepare(`
    INSERT INTO verification_settings (guild_id, role_id, channel_id, log_channel_id)
    VALUES (@guild_id, @role_id, @channel_id, @log_channel_id)
    ON CONFLICT(guild_id) DO UPDATE SET
        role_id = COALESCE(excluded.role_id, role_id),
        channel_id = COALESCE(excluded.channel_id, channel_id),
        log_channel_id = COALESCE(excluded.log_channel_id, log_channel_id)
`);
const removeVerify = db.prepare('DELETE FROM verification_settings WHERE guild_id = ?');

module.exports = {
    get: (guildId) => getVerify.get(guildId),
    set: (data) => {
        const current = getVerify.get(data.guild_id) || {};
        setVerify.run({
            guild_id: data.guild_id,
            role_id: data.role_id !== undefined ? data.role_id : (current.role_id || null),
            channel_id: data.channel_id !== undefined ? data.channel_id : (current.channel_id || null),
            log_channel_id: data.log_channel_id !== undefined ? data.log_channel_id : (current.log_channel_id || null)
        });
    },
    remove: (guildId) => removeVerify.run(guildId)
};