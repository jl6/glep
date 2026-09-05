const path = require('path');
const db = require(path.join(process.cwd(), 'database', 'verificationdb'));

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isButton()) return;

        if (interaction.customId === 'verify_btn') {
            const conf = db.get(interaction.guild.id);
            if (!conf || !conf.role_id) return interaction.reply({ content: 'Verification not set up.', flags: 64 });
            if (interaction.member.roles.cache.has(conf.role_id)) return interaction.reply({ content: 'Already verified.', flags: 64 });

            const { handleVerify } = require(path.join(process.cwd(), 'src', 'utils', 'verificationHandler'));
            return handleVerify(interaction, conf);
        }

        if (interaction.customId.startsWith('ver_ans_')) {
            const [, , chosen, correct] = interaction.customId.split('_');
            const conf = db.get(interaction.guild.id);
            if (!conf || !conf.role_id) return interaction.reply({ content: 'Verification configuration missing.', flags: 64 });

            if (chosen !== correct) {
                return interaction.update({ content: 'Incorrect answer. Try again by clicking the verify button.', embeds: [], components: [] });
            }

            try {
                await interaction.member.roles.add(conf.role_id);
                await interaction.update({ content: 'Successfully verified.', embeds: [], components: [] });
            } catch (err) {
                await interaction.update({ content: 'Failed to assign role.', flags: 64 });
            }
        }
    }
};