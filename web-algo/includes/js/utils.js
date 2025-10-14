export function mostra_tela_aguarde(mensagem = 'Carregando...') {
    const overlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    
    if (overlay) {
        overlay.style.display = 'flex';
        
        if (loadingText) {
            loadingText.textContent = mensagem;
            loadingText.innerText = mensagem;
        }
    }
}

export function esconde_tela_aguarde() {
    const overlay = document.getElementById('loading-overlay');
    
    if (overlay) {
        overlay.style.display = 'none';
        
        // Reseta mensagem para o padrão
        const loadingText = document.getElementById('loading-text');
        if (loadingText) {
            loadingText.textContent = 'Carregando...';
        }
    }
}

export const mostrar_tela_aguarde = mostra_tela_aguarde;
export const esconder_tela_aguarde = esconde_tela_aguarde;