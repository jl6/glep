const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'xplookup',
    description: 'Explains the XP formula, message requirements, and drop rates',
    usage: '[level]',
    async execute(msg, args, client) {
        const lvlTarget = parseInt(args[0]);

        const min = 10;
        const max = 25;
        const avg = (min + max) / 2;
        const calc = l => Math.floor(150 * Math.pow(1.25, l));

        if (!isNaN(lvlTarget) && lvlTarget > 0) {
            let total = 0;
            for (let i = 0; i < lvlTarget; i++) total += calc(i);
            const est = Math.ceil(total / avg);

            const embed = new EmbedBuilder()
                .setTitle(`Level ${lvlTarget} Requirements`)
                .setDescription(`To reach **Level ${lvlTarget}**, you need a cumulative total of **${total} XP**.`)
                .addFields(
                    { name: 'Estimated Messages', value: `~${est} messages`, inline: true },
                    { name: 'Base Formula', value: '`150 * (1.25 ^ level)`', inline: true }
                )
                .setColor(0x2b2d31)
                .setThumbnail(client.user.displayAvatarURL());

            return msg.reply({ embeds: [embed] });
        }

        const embed = new EmbedBuilder()
            .setTitle('Leveling System Guide')
            .setDescription('Overview of XP rates, message requirements, and progression scaling.')
            .addFields(
                { name: 'XP Gain Rate', value: `Earn **${min} - ${max} XP** per message (randomized).`, inline: false },
                { name: 'Progression Formula', value: 'Each level increases the required threshold exponentially using:\n`Required XP = 150 * (1.25 ^ current_level)`', inline: false },
                { name: 'Quick Preview (Next 5 Levels)', value: 
                    `Level 1: ~${Math.ceil(150 / avg)} msgs (150 XP)\n` +
                    `Level 2: ~${Math.ceil((150 + 187) / avg)} msgs (187 XP)\n` +
                    `Level 3: ~${Math.ceil((150 + 187 + 233) / avg)} msgs (233 XP)\n` +
                    `Level 4: ~${Math.ceil((150 + 187 + 233 + 291) / avg)} msgs (291 XP)\n` +
                    `Level 5: ~${Math.ceil((150 + 187 + 233 + 291 + 364) / avg)} msgs (364 XP)`, 
                    inline: false 
                }
            )
            .setFooter({ text: 'Use !xplookup [level] to check a specific target level.' })
            .setColor(0x2b2d31)
            .setThumbnail(client.user.displayAvatarURL());

        return msg.reply({ embeds: [embed] });
    }
};