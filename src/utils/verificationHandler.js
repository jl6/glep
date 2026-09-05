const { createCanvas } = require('@napi-rs/canvas');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, AttachmentBuilder } = require('discord.js');

const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789!@#$%^&*()_=+';

const generateString = () => {
    let res = '';
    for (let i = 0; i < 5; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
    return res;
};

const createCaptchaImage = (text) => {
    const canvas = createCanvas(220, 80);
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#2b2d31';
    ctx.fillRect(0, 0, 220, 80);

    ctx.strokeStyle = '#5865f2';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * 220, Math.random() * 80);
        ctx.lineTo(Math.random() * 220, Math.random() * 80);
        ctx.stroke();
    }

    ctx.font = '30px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, 40, 50);

    return canvas.toBuffer('image/png');
};

module.exports = {
    async handleVerify(interaction, conf) {
        const correct = generateString();
        const fakes = [generateString(), generateString()];
        while (fakes[0] === correct) fakes[0] = generateString();
        while (fakes[1] === correct || fakes[1] === fakes[0]) fakes[1] = generateString();

        const answers = [correct, ...fakes].sort(() => Math.random() - 0.5);
        const buffer = createCaptchaImage(correct);
        const attachment = new AttachmentBuilder(buffer, { name: 'captcha.png' });

        const embed = new EmbedBuilder()
            .setTitle('Human Verification')
            .setDescription('Select the button matching the code shown in the image.')
            .setImage('attachment://captcha.png')
            .setColor(0x2b2d31);

        const row = new ActionRowBuilder().addComponents(
            answers.map(ans => 
                new ButtonBuilder()
                    .setCustomId(`ver_ans_${ans}_${correct}`)
                    .setLabel(ans)
                    .setStyle(ButtonStyle.Secondary)
            )
        );

        await interaction.reply({ embeds: [embed], files: [attachment], components: [row], flags: 64 });
    }
};