const path = require('path');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require(path.join(process.cwd(), 'database', 'verificationdb'));

module.exports = {
    name: 'verification',
    description: 'Configure user verification setup',
    usage: '',
    execute: async (msg, args, client) => {
        if (!msg.member.permissions.has(PermissionFlagsBits.ManageGuild)) return msg.reply('Missing permissions: Manage Guild required.');

        const rows = () => [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('ver_role').setLabel('Role').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('ver_ch').setLabel('Channel').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('ver_wipe').setLabel('Wipe').setStyle(ButtonStyle.Danger)
            ),
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('ver_send').setLabel('Send Panel').setStyle(ButtonStyle.Success)
            )
        ];

        const embed = () => {
            const conf = db.get(msg.guild.id) || {};
            return new EmbedBuilder()
                .setTitle('Verification Configuration')
                .setColor(0x2b2d31)
                .addFields(
                    { name: 'Role', value: conf.role_id ? `<@&${conf.role_id}>` : 'None', inline: true },
                    { name: 'Channel', value: conf.channel_id ? `<#${conf.channel_id}>` : 'None', inline: true }
                );
        };

        const reply = await msg.reply({ embeds: [embed()], components: rows() });
        const filter = i => i.user.id === msg.author.id;
        const collector = reply.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            const conf = db.get(msg.guild.id) || {};

            if (i.customId === 'ver_wipe') {
                db.remove(msg.guild.id);
                return i.update({ content: 'Settings wiped.', embeds: [], components: [] });
            }

            if (i.customId === 'ver_role') {
                await i.reply({ content: 'Mention target role.', flags: 64 });
                const collected = await msg.channel.awaitMessages({ filter: m => m.author.id === msg.author.id && m.mentions.roles.size, max: 1, time: 30000 }).catch(() => null);
                if (!collected || !collected.size) return i.followUp({ content: 'Timed out or invalid role.', flags: 64 });
                
                const role = collected.first().mentions.roles.first();
                db.set({ guild_id: msg.guild.id, role_id: role.id });
                await i.followUp({ content: `Role set to <@&${role.id}>`, flags: 64 });
                return reply.edit({ embeds: [embed()], components: rows() }).catch(() => {});
            }

            if (i.customId === 'ver_ch') {
                await i.reply({ content: 'Mention target channel.', flags: 64 });
                const collected = await msg.channel.awaitMessages({ filter: m => m.author.id === msg.author.id && m.mentions.channels.size, max: 1, time: 30000 }).catch(() => null);
                if (!collected || !collected.size) return i.followUp({ content: 'Timed out or invalid channel.', flags: 64 });
                
                const ch = collected.first().mentions.channels.first();
                db.set({ guild_id: msg.guild.id, channel_id: ch.id });
                await i.followUp({ content: `Channel set to <#${ch.id}>`, flags: 64 });
                return reply.edit({ embeds: [embed()], components: rows() }).catch(() => {});
            }

            if (i.customId === 'ver_send') {
                if (!conf.channel_id || !conf.role_id) return i.reply({ content: 'Configure role and channel first.', flags: 64 });
                const targetCh = msg.guild.channels.cache.get(conf.channel_id);
                if (!targetCh) return i.reply({ content: 'Target channel not found.', flags: 64 });

                const panelEmbed = new EmbedBuilder()
                    .setTitle('Server Verification')
                    .setDescription('Click the button below to verify and gain access to the server.')
                    .setColor(0x2b2d31);

                const panelRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('verify_btn').setLabel('Verify').setStyle(ButtonStyle.Success)
                );

                await targetCh.send({ embeds: [panelEmbed], components: [panelRow] });
                return i.reply({ content: 'Verification panel sent.', flags: 64 });
            }
        });
    }
};