const { createCanvas, loadImage } = require('@napi-rs/canvas');
const { AttachmentBuilder } = require('discord.js');
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(process.cwd(), 'database', 'data.db'));
const calcXp = lvl => Math.floor(150 * Math.pow(1.25, lvl));

const renderCard = async (member, stats, color) => {
    const canvas = createCanvas(400, 130);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0f1115';
    ctx.fillRect(0, 0, 400, 130);

    const grad = ctx.createLinearGradient(0, 0, 400, 130);
    grad.addColorStop(0, '#1a1c23');
    grad.addColorStop(1, '#111318');
    ctx.fillStyle = grad;
    ctx.fillRect(8, 8, 384, 114);

    ctx.strokeStyle = '#2d3139';
    ctx.lineWidth = 1;
    ctx.strokeRect(8, 8, 384, 114);

    try {
        const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 128 });
        const avatar = await loadImage(avatarUrl);
        ctx.save();
        ctx.beginPath();
        ctx.arc(52, 65, 30, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 22, 35, 60, 60);
        ctx.restore();

        ctx.strokeStyle = color || '#5865f2';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(52, 65, 31, 0, Math.PI * 2, true);
        ctx.stroke();
    } catch {}

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(member.user.username, 98, 48);

    if (member.nickname && member.nickname !== member.user.username) {
        ctx.fillStyle = '#8e9297';
        ctx.font = '9px sans-serif';
        ctx.fillText(`AKA: ${member.nickname}`, 98, 61);
    }

    ctx.fillStyle = '#b9bbbe';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`LEVEL ${stats.level}`, 376, 45);

    ctx.fillStyle = '#72767d';
    ctx.font = '8px sans-serif';
    ctx.fillText(`Messages: ${stats.messages}`, 376, 57);
    ctx.textAlign = 'left';

    const req = calcXp(stats.level);
    const prog = Math.min(stats.xp / req, 1);

    const bx = 98;
    const by = 80;
    const bw = 278;
    const bh = 12;

    ctx.fillStyle = '#202225';
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 6);
    ctx.fill();

    if (color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(bx, by, Math.max(bw * prog, 12), bh, 6);
        ctx.fill();
    } else {
        const barGrad = ctx.createLinearGradient(bx, by, bx + bw, by);
        barGrad.addColorStop(0, '#5865f2');
        barGrad.addColorStop(1, '#eb459e');
        ctx.fillStyle = barGrad;
        ctx.beginPath();
        ctx.roundRect(bx, by, Math.max(bw * prog, 12), bh, 6);
        ctx.fill();
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${stats.xp} / ${req} XP (${Math.floor(prog * 100)}%)`, bx + bw - 8, by + 9);
    ctx.textAlign = 'left';

    return canvas.toBuffer('image/png');
};

module.exports = {
    name: 'rank',
    description: 'Displays user rank card',
    usage: '[@user]',
    async execute(msg, args, client) {
        if (!msg.guild) return msg.reply('This command can only be used in a server.');

        const target = msg.mentions.users.first() || msg.author;
        const member = await msg.guild.members.fetch(target.id).catch(() => null);
        if (!member) return msg.reply('Member not found.');

        let stats = db.prepare('SELECT xp, level, messages FROM user_levels WHERE user_id = ? AND guild_id = ?').get(target.id, msg.guild.id);
        if (!stats) stats = { xp: 0, level: 0, messages: 0 };

        const pref = db.prepare('SELECT bar_color FROM user_preferences WHERE user_id = ? AND guild_id = ?').get(target.id, msg.guild.id);
        const color = pref ? pref.bar_color : null;

        const buf = await renderCard(member, stats, color);
        const att = new AttachmentBuilder(buf, { name: 'rank.png' });
        return msg.reply({ files: [att] });
    }
};