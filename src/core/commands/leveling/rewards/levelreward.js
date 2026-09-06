const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(process.cwd(), 'database', 'data.db'));

db.exec(`
    CREATE TABLE IF NOT EXISTS level_rewards (
        guild_id TEXT,
        level INTEGER,
        role_id TEXT,
        PRIMARY KEY (guild_id, level)
    );
`);

module.exports = {
    name: 'levelrewards',
    description: 'Interactive management panel for level-up role rewards',
    async execute(msg, args, client) {
        if (!msg.member.permissions.has(PermissionFlagsBits.ManageRoles) && !msg.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return msg.reply('Missing permissions.');
        }

        const fetchEmbed = () => {
            const rows = db.prepare('SELECT level, role_id FROM level_rewards WHERE guild_id = ? ORDER BY level ASC').all(msg.guild.id);
            const embed = new EmbedBuilder().setTitle('Server Level Rewards Manager').setColor(0x2b2d31);

            if (!rows.length) {
                embed.setDescription('No rewards configured yet. Click the button below to add one.');
            } else {
                const list = rows.map(r => `Level ${r.level} -> <@&${r.role_id}>`).join('\n');
                embed.setDescription(`Configured Rewards:\n\n${list}`);
            }
            return embed;
        };

        const fetchRow = () => new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('reward_add').setLabel('Add / Edit Reward').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('reward_remove').setLabel('Remove Reward').setStyle(ButtonStyle.Danger)
        );

        const reply = await msg.reply({ embeds: [fetchEmbed()], components: [fetchRow()] });
        const filter = i => i.user.id === msg.author.id;
        const col = reply.createMessageComponentCollector({ filter, time: 120000 });

        col.on('collect', async i => {
            if (!i.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
                return i.reply({ content: 'Missing permissions.', ephemeral: true });
            }

            if (i.customId === 'reward_add') {
                const modal = new ModalBuilder().setCustomId('modal_add_reward').setTitle('Configure Level Reward');
                const levelInput = new TextInputBuilder().setCustomId('input_level').setLabel('Target Level').setStyle(TextInputStyle.Short).setRequired(true);
                const roleInput = new TextInputBuilder().setCustomId('input_role_id').setLabel('Role ID').setStyle(TextInputStyle.Short).setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(levelInput), new ActionRowBuilder().addComponents(roleInput));
                await i.showModal(modal);

                try {
                    const sub = await i.awaitModalSubmit({ filter: x => x.customId === 'modal_add_reward' && x.user.id === msg.author.id, time: 60000 });
                    const lvl = parseInt(sub.fields.getTextInputValue('input_level'));
                    const roleId = sub.fields.getTextInputValue('input_role_id').trim();

                    if (isNaN(lvl) || !msg.guild.roles.cache.has(roleId)) {
                        return sub.reply({ content: 'Invalid level or role ID.', ephemeral: true });
                    }

                    db.prepare('INSERT OR REPLACE INTO level_rewards (guild_id, level, role_id) VALUES (?, ?, ?)').run(msg.guild.id, lvl, roleId);
                    await sub.update({ embeds: [fetchEmbed()], components: [fetchRow()] });
                } catch (err) {}
            } else if (i.customId === 'reward_remove') {
                const modal = new ModalBuilder().setCustomId('modal_remove_reward').setTitle('Remove Level Reward');
                const levelInput = new TextInputBuilder().setCustomId('input_level_remove').setLabel('Level to remove').setStyle(TextInputStyle.Short).setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(levelInput));
                await i.showModal(modal);

                try {
                    const sub = await i.awaitModalSubmit({ filter: x => x.customId === 'modal_remove_reward' && x.user.id === msg.author.id, time: 60000 });
                    const lvl = parseInt(sub.fields.getTextInputValue('input_level_remove'));

                    if (isNaN(lvl)) {
                        return sub.reply({ content: 'Invalid level.', ephemeral: true });
                    }

                    const res = db.prepare('DELETE FROM level_rewards WHERE guild_id = ? AND level = ?').run(msg.guild.id, lvl);
                    if (res.changes === 0) {
                        return sub.reply({ content: `No reward found for level ${lvl}.`, ephemeral: true });
                    }

                    await sub.update({ embeds: [fetchEmbed()], components: [fetchRow()] });
                } catch (err) {}
            }
        });

        col.on('end', () => reply.edit({ components: [] }).catch(() => {}));
    }
};