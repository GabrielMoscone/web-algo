export function mostra_tela_aguarde(msg) {
    "use strict";
    if (msg == undefined) msg = '';
    const aguardeEl = document.getElementById('tela_aguarde');
    if (aguardeEl) aguardeEl.style.display = 'flex';
}

export function esconde_tela_aguarde() {
    "use strict";
    const aguardeEl = document.getElementById('tela_aguarde');
    if (aguardeEl) aguardeEl.style.display = 'none';
}