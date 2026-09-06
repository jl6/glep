const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'roleall',
    description: 'Assign a role to all members',
    usage: '[role]',
    devOnly: true,
    execute: async (msg, args, client) => {
        if (!msg.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return msg.reply('Missing permissions: Manage Roles required.');
        }

        const role = msg.mentions.roles.first();
        if (!role) return msg.reply('Mention a role to assign.');

        await msg.reply('Processing role assignment for all members...');

        try {
            const members = await msg.guild.members.fetch();
            let count = 0;

            for (const [, member] of members) {
                if (!member.roles.cache.has(role.id) && !member.user.bot) {
                    try {
                        await member.roles.add(role);
                        count++;
                    } catch {}
                }
            }

            await msg.channel.send(`Successfully assigned role to ${count} members.`);
        } catch (err) {
            await msg.channel.send('Failed to fetch members or assign roles.');
        }
    }
};