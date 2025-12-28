<?php
$token = "8255731465:AAGrPR_qH0zC4zTdBqOj-Zt1jqY0W03-yws";
$chat_id = "7993722214";
$url = "https://api.telegram.org/bot$token/sendMessage?chat_id=$chat_id&text=Prueba_de_Conexion";

$response = file_get_contents($url);
if ($response) {
    echo "<h1>✅ EL MENSAJE LLEGÓ A TELEGRAM</h1>";
} else {
    echo "<h1>❌ TU HOSTING BLOQUEA A TELEGRAM</h1>";
    echo "<p>Error: " . error_get_last()['message'] . "</p>";
}
?>
