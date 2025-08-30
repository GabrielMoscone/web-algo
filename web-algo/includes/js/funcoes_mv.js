/* jshint esversion: 6 */
import { globalVar } from './globals.js';

function verifica_tamanho_variavel(valor, tipo, variavel){
    return true;
    // if (tipo.tipo === 'int' && (valor > 2147483647 || valor < -2147483647)){
    //     throw `Erro: overflow detectado. O valor excede o limite máximo permitido para o tipo 'int' na variavel ${variavel} (linha: ${globalVar.linha})`;
    // }
}

// teste

export function inicializa_escopos(qtd_escopos){
    while(qtd_escopos >= 0){
        globalVar.variaveis_vm.push({'variaveis': {}, 'escopo_pai': 0});
        qtd_escopos--;
    }
}

function modifica_historico_variavel(variavel, valor){
    if (!(variavel in globalVar.vm_funcoes)){
        if (variavel in globalVar.historico_variaveis){
            globalVar.historico_variaveis[variavel].push(valor);
        } else {
            globalVar.historico_variaveis[variavel] = [valor];
        }
        globalVar.worker.postMessage({'atualiza_tabela_variaveis': globalVar.historico_variaveis});
    }
}

export function altera_escopo_pai(){
    globalVar.variaveis_vm[globalVar.vm_escopo]['escopo_pai'] = globalVar.vm_escopo_pai;
}

function verifica_existencia_variavel_escopo(variavel){

    for (let index=globalVar.vm_escopo; index>=0;index = globalVar.variaveis_vm[index]['escopo_pai']){
        if (variavel in globalVar.variaveis_vm[index]['variaveis']){
            return index;
        }
        if (index === 0){
            return globalVar.vm_escopo;
        }
    }
}

export function inicializa_matriz(variavel, tam_vetor, tam_matriz) {
    let vetor = [];
    for (let i = 0; i < tam_vetor; i++) {
        vetor.push([]);
        for (let j = 0; j < tam_matriz; j++) {
            vetor[i].push(0);
        }
    }
    globalVar.variaveis_vm[globalVar.vm_escopo]['variaveis'][variavel] = {'valor': vetor};
    modifica_historico_variavel(variavel, globalVar.variaveis_vm[globalVar.vm_escopo]['variaveis'][variavel]["valor"].slice());
    return vetor;
}

export function inicializa_vetor(variavel, tam_vetor) {
    let vetor = [];
    for (let i = 0; i < tam_vetor; i++) {
        vetor.push(0);
    }
    globalVar.variaveis_vm[globalVar.vm_escopo]['variaveis'][variavel] = {'valor': vetor};
    modifica_historico_variavel(variavel, globalVar.variaveis_vm[globalVar.vm_escopo]['variaveis'][variavel]["valor"].slice());
    return vetor;
}

export function realiza_atribuicao_parametros(parametros, dados_param, parametros_tipos, linha){
    for (let i=0; i<parametros.length; i++){
        let eh_vetor = verifica_se_eh_vetor(parametros[i]);
        let eh_matriz = verifica_se_eh_matriz(parametros[i]);
        let dados;
        let escopo_real;
        if (eh_vetor) {
            dados = extrai_variavel_e_posicao_vetor(parametros[i]);
            escopo_real = globalVar.vm_escopo;
            let posicao = getValue(dados.posicao);
            if (Array.isArray(dados_param[i])) {
                for (let j = 0; j < posicao; j++) {
                    if (!Array.isArray(dados_param[i][j])){
                        globalVar.variaveis_vm[escopo_real]['variaveis'][dados.variavel]['valor'][j] = dados_param[i][j];
                    } else {
                        throw `Erro: Valor passado não corresponde com valor esperado no parâmetro ${dados.variavel} (linha: ${linha})`;
                    }
                }
            } else {
                throw `Erro: Valor passado não corresponde com valor esperado no parâmetro ${dados.variavel} (linha: ${linha})`;
            }
        } else if (eh_matriz){
            dados = extrai_variavel_e_posicao_matriz(parametros[i]);
            escopo_real = globalVar.vm_escopo;
            let posicao1 = getValue(dados["posicoes"][0]);
            let posicao2 = getValue(dados["posicoes"][1]);
            if (Array.isArray(dados_param[i])) {
                for (let j = 0; j < posicao1; j++) {
                    if (Array.isArray(dados_param[i][j])) {
                        for (let k = 0; k < posicao2; k++) {
                            globalVar.variaveis_vm[escopo_real]['variaveis'][dados.variavel]['valor'][j][k] = dados_param[i][j][k];
                        }
                    } else {
                        throw `Erro: Valor passado não corresponde com valor esperado no parâmetro ${dados.variavel} (linha: ${linha})`;
                    }
                }
            } else {
                throw `Erro: Valor passado não corresponde com valor esperado no parâmetro ${dados.variavel} (linha: ${linha})`;
            }
        } else {
            if (Array.isArray(dados_param[i])){
                throw `Erro de tipo: Esperado um valor do tipo 'numeral' e recebeu um 'vetor' (linha: ${linha})`;
            }
            setValue(dados_param[i], parametros[i], true, parametros_tipos[parametros[i]]['tipo']);
        }
    }
}

export function indexa_linhas(codigo_c3e) {
    let c3e;
    for (let i = 0; i < codigo_c3e.length; i++) {
        c3e = codigo_c3e[i];
        if (c3e.label) {
            globalVar.index_goto[c3e.result] = i;
        }
    }
}

export function getUserInput(worker, variavel) {
    return new Promise((resolve) => {

        // Envia a solicitação ao script principal
        worker.postMessage({'le': true, 'var': variavel});

        // Aguardar a resposta do script principal
        worker.onmessage = (event) => {
          resolve(event.data); // Resolve a Promise com o dado recebido
        };
    });
}

export function getUserDebug(worker) {

    return new Promise((resolve) => {

        // Envia a solicitação ao script principal
        worker.postMessage({'debugger': true, 'linha_atual': globalVar.linha_atual, 'linha_anterior': globalVar.linha_anterior});

        // Aguardar a resposta do script principal
        worker.onmessage = (event) => {
            globalVar.ativa_proximo_passo = event.data.ativa_proximo_passo;
          resolve(event.data); // Resolve a Promise com o dado recebido
        };
    });
}

function verifica_operador_unario(valor) {
    return ['!', '+', '-'].includes(String(valor)[0]);
}

const regex = /^[+-]?\d+(\.\d+)?$/;
function verifica_constante(valor) {
    return regex.test(String(valor));
}

export function verifica_temporaria(valor) {
    return String(valor)[0] === '@';
}

export function verifica_se_eh_vetor(valor) {
    // Regex para variável ou constante: [a-zA-Z_]\w*
    // Regex para expressão dentro dos colchetes: aceita variáveis, números, operadores, e parênteses
    //const arrayNotationRegex = /^[a-zA-Z_]\w*(\[\s*([a-zA-Z_]\w*|\d+|@\w+|\[[a-zA-Z_]\w*|\d+|@\w+\])\s*\])+$/;
    //const arrayNotationRegex = /^[a-zA-Z_]\w*(\[(?:[a-zA-Z_]\w*|\d+|@\d+|[+\-*/()]|\[(?:[a-zA-Z_]\w*|\d+|@\d+|[+\-*/()]|\[(?:[a-zA-Z_]\w*|\d+|@\d+|[+\-*/()])*\])*\])*\])$/;
    // const arrayNotationRegex = /^[a-zA-Z_]\w*(\[(?:[a-zA-Z_]\w*|\d+|@t\d+|[+\-*/()]|\[(?:[a-zA-Z_]\w*|\d+|@t\d+|[+\-*/()]|\[(?:[a-zA-Z_]\w*|\d+|@t\d+|[+\-*/()])*\])*\])*\])$/;
    // 7 aninhações
    const arrayNotationRegex = /^[a-zA-Z_]\w*(\[(?:[a-zA-Z_]\w*|\d+|@t\d+|[+\-*/()]|\[(?:[a-zA-Z_]\w*|\d+|@t\d+|[+\-*/()]|\[(?:[a-zA-Z_]\w*|\d+|@t\d+|[+\-*/()]|\[(?:[a-zA-Z_]\w*|\d+|@t\d+|[+\-*/()]|\[(?:[a-zA-Z_]\w*|\d+|@t\d+|[+\-*/()]|\[(?:[a-zA-Z_]\w*|\d+|@t\d+|[+\-*/()]|\[(?:[a-zA-Z_]\w*|\d+|@t\d+|[+\-*/()])*\])*\])*\])*\])*\])*\])*\])$/;
    return arrayNotationRegex.test(valor);
}

export function verifica_se_eh_matriz(valor) {
    // Regex para variável ou constante: [a-zA-Z_]\w*
    // Regex para expressões dentro dos colchetes: [a-zA-Z0-9_+\-*/()@ ]
    let matrixNotationRegex = /^[a-zA-Z_]\w*(\[(?:[a-zA-Z_]\w*|\d+|@t\d+|[+\-*/()]|\[(?:[a-zA-Z_]\w*|\d+|@t\d+|[+\-*/()]|\[(?:[a-zA-Z_]\w*|\d+|@t\d+|[+\-*/()])*\])*\])*\]?)\[(?:[a-zA-Z_]\w*|\d+|@t\d+|[+\-*/()]|\[(?:[a-zA-Z_]\w*|\d+|@t\d+|[+\-*/()]|\[(?:[a-zA-Z_]\w*|\d+|@t\d+|[+\-*/()])*\])*\])*\]?$/;
    return matrixNotationRegex.test(valor);
}

export function verifica_se_eh_chamada_de_funcao(valor){
    // Regex para verificar se a string começa com $ seguido por uma letra e depois qualquer combinação de letras, números ou sublinhados
    const functionRegex = /^\$[a-zA-Z][a-zA-Z0-9_]*$/;
    return functionRegex.test(valor);
}

export function verifica_se_eh_return(valor){
    return valor === 'return';
}

export function extrai_variavel_e_posicao_vetor(valor) {
    // Regex para capturar a variável e a posição, onde a posição pode incluir variáveis, constantes e expressões
    const regex = /^([a-zA-Z_$@][a-zA-Z_$@0-9]*)\[(.+)\]$/;

    // Executa o regex na expressão fornecida
    const match = valor.match(regex);

    // Verifica se a expressão corresponde ao padrão esperado
    if (match) {
        return {
            variavel: match[1],
            posicao: match[2].trim() // Mantém a expressão como string e remove espaços extras
        };
    } else {
        return null; // Retorna null se a expressão não corresponder ao padrão esperado
    }
}

export function extrai_variavel_e_posicao_matriz(valor) {
    // Regex para capturar a variável e os colchetes
    const regex = /^([a-zA-Z_]\w*)(\[(.*)\])$/;

    // Executa o regex na expressão fornecida
    const match = valor.match(regex);

    if (match) {
        const variavel = match[1];
        const dimensoes = match[2];

        // Função para processar aninhamentos
        function processaDimensoes(dimensao) {
            let resultado = [];
            let nivel = 0;
            let inicio = 0;

            for (let i = 0; i < dimensao.length; i++) {
                if (dimensao[i] === '[') {
                    if (nivel === 0) {
                        inicio = i + 1;
                    }
                    nivel++;
                } else if (dimensao[i] === ']') {
                    nivel--;
                    if (nivel === 0) {
                        resultado.push(dimensao.substring(inicio, i).trim());
                    }
                }
            }

            return resultado;
        }

        // Processa as dimensões para cada nível
        let dimensaoAtual = dimensoes;
        let dimensoesSeparadas = [];

        while (dimensaoAtual) {
            const dimensoesNiveis = processaDimensoes(dimensaoAtual);
            dimensoesSeparadas = dimensoesSeparadas.concat(dimensoesNiveis);
            if (dimensoesNiveis.length > 1) {
                // Adiciona o próximo nível de dimensões
                dimensaoAtual = dimensoesNiveis.pop();
            } else {
                break;
            }
        }

        return {
            variavel: variavel,
            posicoes: dimensoesSeparadas
        };
    } else {
        return null; // Retorna null se a expressão não corresponder ao padrão esperado
    }
}


function formata_numero_conforme_tipo(arg, tipo){
    if (tipo === 'int'){
        return Math.floor(arg);
    } else {
        return arg;
    }

}

export function empilha_variaveis_recursao(escopo){
    if ('recursao' in globalVar.variaveis_vm[escopo]){
        globalVar.variaveis_vm[escopo]['recursao'].push(JSON.parse(JSON.stringify(globalVar.variaveis_vm[escopo]['variaveis'])));
    } else {
        globalVar.variaveis_vm[escopo]['recursao'] = [JSON.parse(JSON.stringify(globalVar.variaveis_vm[escopo]['variaveis']))];
    }

    for (let chave in globalVar.variaveis_vm[escopo]['variaveis']) {
        if (globalVar.variaveis_vm[escopo]['variaveis'].hasOwnProperty(chave)) {
            globalVar.variaveis_vm[escopo]['variaveis'][chave] = {'valor': 0, 'tipo': globalVar.variaveis_vm[escopo]['variaveis']['tipo']};
        }
    }
}

function verificarPosicaoExiste(array, posicao) {
    return posicao in array;
}


export function getValue(expressao, retorna_tipo=false) {
    let resultado;
    let operador = false;
    if (verifica_operador_unario(expressao)) {
        operador = String(expressao)[0];
        expressao = expressao.toString().substring(1);
    }

    let eh_matriz;
    let eh_vetor;
    // VERIFICA SE EXPRESSÃO CONDICIONAL NÃO É NUMÉRICO
    if (verifica_constante(expressao)) {
        if (retorna_tipo){
            if (globalVar.regexNumero.test(expressao)){
                if (!Number.isInteger(Number(expressao))){
                    return 'float';
                }
                return 'int';
            }
        }
        resultado = expressao;
    } else if (verifica_temporaria(expressao)) {
        let escopo_real = verifica_existencia_variavel_escopo(expressao);
        resultado = Number(globalVar.variaveis_vm[escopo_real]['variaveis'][expressao]['valor']);
        while (verifica_temporaria(resultado)){
            resultado = Number(globalVar.variaveis_vm[escopo_real]['variaveis'][expressao]['valor']);
        }
        if (retorna_tipo){
            if (globalVar.variaveis_vm[escopo_real]['variaveis'][expressao]['tipo']){
                return globalVar.variaveis_vm[escopo_real]['variaveis'][expressao]['tipo']
            }
            return '@';
        }
    } else {
        eh_vetor = verifica_se_eh_vetor(expressao);
        eh_matriz = verifica_se_eh_matriz(expressao);
        let dados;
        if (eh_vetor) {
            dados = extrai_variavel_e_posicao_vetor(expressao);
            let posicao = getValue(dados.posicao);
            let escopo_real = verifica_existencia_variavel_escopo(dados.variavel);
            if (verificarPosicaoExiste(globalVar.variaveis_vm[escopo_real]["variaveis"][dados.variavel]['valor'], posicao)){
                resultado = Number(globalVar.variaveis_vm[escopo_real]['variaveis'][dados.variavel]['valor'][posicao]);
                if (retorna_tipo){
                    return globalVar.variaveis_vm[escopo_real]['variaveis'][dados.variavel]['tipo'];
                }
            } else {
                throw `Erro: A posição ${posicao} não existe no vetor (linha: ${globalVar.linha}).`;
            }
        } else if (eh_matriz){
            dados = extrai_variavel_e_posicao_matriz(expressao);
            let posicao1 = getValue(dados["posicoes"][0]);
            let posicao2 = getValue(dados["posicoes"][1]);
            let escopo_real = verifica_existencia_variavel_escopo(dados.variavel);
            if (verificarPosicaoExiste(globalVar.variaveis_vm[escopo_real]["variaveis"][dados.variavel]['valor'], posicao1)){
                if (verificarPosicaoExiste(globalVar.variaveis_vm[escopo_real]["variaveis"][dados.variavel]['valor'][posicao1], posicao2)){
                    resultado = Number(globalVar.variaveis_vm[escopo_real]['variaveis'][dados.variavel]['valor'][posicao1][posicao2]);
                    if (retorna_tipo){
                        return globalVar.variaveis_vm[escopo_real]['variaveis'][dados.variavel]['tipo'];
                    }
                } else {
                    throw `Erro: A posição ${posicao2} não existe no vetor (linha: ${globalVar.linha}).`;
                }
            } else {
                throw `Erro: A posição ${posicao1} não existe no vetor (linha: ${globalVar.linha}).`;
            }
        } else {
            let escopo_real = verifica_existencia_variavel_escopo(expressao);
            if (!(expressao in globalVar.variaveis_vm[escopo_real]['variaveis'])){
                globalVar.variaveis_vm[escopo_real]['variaveis'][expressao] = {'valor': Number(NaN)};
            }
            resultado = globalVar.variaveis_vm[escopo_real]['variaveis'][expressao]['valor'];
            if (retorna_tipo){
                return globalVar.variaveis_vm[escopo_real]['variaveis'][expressao]['tipo'];
            }
            if (Array.isArray(resultado)){
                return resultado;
            }
        }
    }

    switch (operador) {
        case '!':
            let operacao = !Number(resultado);
            return operacao ? 1 : 0;
        case '+':
            return +Number(resultado);
        case '-':
            return -Number(resultado);
        default:
            return Number(resultado);
    }
}

export function setValue(valor, variavel, verifica_existencia_de_variavel=true, tipo_variavel=false){
    let eh_vetor = verifica_se_eh_vetor(variavel);
    let eh_matriz = verifica_se_eh_matriz(variavel);
    let dados;
    let escopo_real;
    if (eh_vetor) {
        dados = extrai_variavel_e_posicao_vetor(variavel);
        if (verifica_existencia_de_variavel){
            escopo_real = verifica_existencia_variavel_escopo(dados.variavel);
        } else {
            escopo_real = globalVar.vm_escopo;
        }
        let posicao = getValue(dados.posicao);
        // FAZER TESTE DE TAMANHO DO VETOR EM CASO DE ERRO ESTOURAR ERRO DE TAMANHO DE MATRIZ.
        if (verificarPosicaoExiste(globalVar.variaveis_vm[escopo_real]["variaveis"][dados.variavel]['valor'], posicao)){
            if (globalVar.variaveis_vm[escopo_real]['variaveis'][dados.variavel].tipo){
                verifica_tamanho_variavel(Number(formata_numero_conforme_tipo(getValue(valor), globalVar.variaveis_vm[escopo_real]["variaveis"][dados.variavel]['tipo'])), globalVar.variaveis_vm[escopo_real]['variaveis'][dados.variavel], dados.variavel);
            }
            globalVar.variaveis_vm[escopo_real]['variaveis'][dados.variavel]['valor'][posicao] = Number(formata_numero_conforme_tipo(getValue(valor), globalVar.variaveis_vm[escopo_real]['variaveis'][dados.variavel]['tipo']));
            modifica_historico_variavel(dados.variavel, globalVar.variaveis_vm[escopo_real]['variaveis'][dados.variavel]['valor'].slice());
        } else {
            throw `Erro: A posição ${posicao} não existe no vetor (linha: ${globalVar.linha}).`;
        }
    } else if (eh_matriz){
        dados = extrai_variavel_e_posicao_matriz(variavel);
        let posicao1 = getValue(dados["posicoes"][0]);
        let posicao2 = getValue(dados["posicoes"][1]);
        if (verifica_existencia_de_variavel){
            escopo_real = verifica_existencia_variavel_escopo(dados.variavel);
        } else {
            escopo_real = globalVar.vm_escopo;
        }
        // FAZER TESTE DE TAMANHO DO VETOR EM CASO DE ERRO ESTOURAR ERRO DE TAMANHO.
        if (verificarPosicaoExiste(globalVar.variaveis_vm[escopo_real]["variaveis"][dados.variavel]['valor'], posicao1)){
            if (verificarPosicaoExiste(globalVar.variaveis_vm[escopo_real]["variaveis"][dados.variavel]['valor'][posicao1], posicao2)){
                if (globalVar.variaveis_vm[escopo_real]['variaveis'][dados.variavel].tipo){
                    verifica_tamanho_variavel(Number(formata_numero_conforme_tipo(getValue(valor), globalVar.variaveis_vm[escopo_real]["variaveis"][dados.variavel]['tipo'])), globalVar.variaveis_vm[escopo_real]['variaveis'][dados.variavel], dados.variavel);
                }
                globalVar.variaveis_vm[escopo_real]["variaveis"][dados.variavel]['valor'][posicao1][posicao2] = Number(formata_numero_conforme_tipo(getValue(valor), globalVar.variaveis_vm[escopo_real]["variaveis"][dados.variavel]['tipo']));
                modifica_historico_variavel(dados.variavel, globalVar.variaveis_vm[escopo_real]["variaveis"][dados.variavel]['valor'].slice());
            } else {
                throw `Erro: A posição ${posicao2} não existe no vetor (linha: ${globalVar.linha}).`;
            }
        } else {
            throw `Erro: A posição ${posicao1} não existe no vetor (linha: ${globalVar.linha}).`;
        }
    } else {
        if (verifica_existencia_de_variavel){
            escopo_real = verifica_existencia_variavel_escopo(variavel);
        } else {
            escopo_real = globalVar.vm_escopo;
        }
        if (!(variavel in globalVar.variaveis_vm[escopo_real]['variaveis'])) {
            globalVar.variaveis_vm[escopo_real]['variaveis'][variavel] = {'valor': '',
                                                                'tipo': ''};
            if (tipo_variavel){
                globalVar.variaveis_vm[escopo_real]['variaveis'][variavel]['tipo'] = tipo_variavel;
            }
        }
        if (globalVar.variaveis_vm[escopo_real]['variaveis'][variavel].tipo){
            verifica_tamanho_variavel(Number(formata_numero_conforme_tipo(getValue(valor), globalVar.variaveis_vm[escopo_real]['variaveis'][variavel]['tipo'])), globalVar.variaveis_vm[escopo_real]['variaveis'][variavel], variavel);
        }
        globalVar.variaveis_vm[escopo_real]['variaveis'][variavel]['valor'] = Number(formata_numero_conforme_tipo(getValue(valor), globalVar.variaveis_vm[escopo_real]['variaveis'][variavel]['tipo']));
        if (!verifica_temporaria(variavel)){
            modifica_historico_variavel(variavel, globalVar.variaveis_vm[escopo_real]['variaveis'][variavel]['valor']);
        }

    }
}

export function parsePrintf(valor) {
    // Regex para capturar a string formatada e os parâmetros
    const printfRegex = /printf\s*\(\s*"([^"]*)"\s*(?:,\s*([^()]*|\([^()]*\))*\s*)*\)/;

    // Executa a regex para capturar os grupos
    const matches = valor.match(printfRegex);

    if (!matches) {
        return null;
    }

    const formattedString = matches[1];
    const paramsString = valor.slice(valor.indexOf(formattedString) + formattedString.length + 1, valor.lastIndexOf(')')).trim();
    const params = paramsString.split(/\s*,\s*/);

    return {
        formattedString,
        params
    };
}

// export function formataStringInt(template, values, linha) {
//     let arg;
//     return template.replace(/%d/g, () => {
//         let tipo = getValue(values[globalVar.index], true);
//         if (tipo !== 'int'){
//             throw `Erro: esperava argumento do tipo 'int' e encontrou argumento do tipo ${tipo} (linha: ${linha})`;
//         }
//         arg = getValue(values[globalVar.index]);
//         globalVar.index++;
//         return Math.floor(arg);
//     });
// }

export function formataString(template, values, linha) {
    let arg;
    return template.replace(/%(\.\d+)?[fd]/g, (match, decimals, type) => {
        let tipo = getValue(values[globalVar.index], true);
        if (match === '%f' || decimals){
            if (tipo !== '@' && tipo === 'int'){
                throw `Erro: esperava argumento do tipo 'float ou double' e encontrou argumento do tipo ${tipo} (linha: ${linha})`;
            }
            arg = getValue(values[globalVar.index]);
            globalVar.index++;

            if (decimals) {
                // Se o formato for do tipo %.nf, extrair o número de casas decimais
                let precision = parseInt(decimals.slice(1)); // Remove o ponto (.) e converte para inteiro
                return parseFloat(arg).toFixed(precision);
            } else {
                // Se for apenas %f, retorna o valor original como float
                return parseFloat(arg).toFixed(6);
            }
        } else {
            if (tipo !== '@' && tipo !== 'int' && tipo !== 'char'){
                throw `Erro: esperava argumento do tipo 'int' e encontrou argumento do tipo ${tipo} (linha: ${linha})`;
            }
            arg = getValue(values[globalVar.index]);
            globalVar.index++;
            return Math.floor(arg);
            }
    });
}

export function carrega_parametros(lista_param){
    let parametros = [];
    for (let i=0; i<lista_param.length;i++){
        parametros.push(getValue(lista_param[i]));
    }
    return parametros;
}

export function formataStringQuebraLinha(template) {
    return template.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
}

export function parseScanf(valor) {
    // Regex para capturar a string formatada e os parâmetros
    const scanfRegex = /scanf\s*\(\s*"([^"]*)"\s*(?:,\s*([^()]*|\([^()]*\))*\s*)*\)/;

    // Executa a regex para capturar os grupos
    const matches = valor.match(scanfRegex);

    if (!matches) {
        return null;
    }

    const formattedString = matches[1];
    const paramsString = valor.slice(valor.indexOf(formattedString) + formattedString.length + 2, valor.lastIndexOf(')')).trim(); // Adjust index to get correct parameters
    const params = paramsString.split(/\s*,\s*/).map(param => param.replace(/^&\s*/, ''));

    for (let i=0; i<params.length; i++){
        let tipo = getValue(params[i], true);
        if (formattedString.slice(i*2, (i+1)*2) === '%f'){
            if (tipo === 'int'){
                throw `Erro: esperava argumento do tipo 'int' e encontrou argumento do tipo ${tipo} (linha: ${globalVar.linha})`;
            }
        } else {
            if (tipo !== 'int'){
                throw `Erro: esperava argumento do tipo '${tipo}' e encontrou argumento do tipo int (linha: ${globalVar.linha})`;
            }
        }
    }

    return {
        formattedString,
        params
    };
}

export function calcula_argumentos(arg1, arg2, op){
    if (op === '+') {
        return Number(arg1) + Number(arg2);
    }
    if (op === '-') {
        return Number(arg1) - Number(arg2);
    }
    if (op === '/') {
        if (Number(arg2) === 0){
            globalVar.warning_msg = `\nAtenção: divisão por 0 encontrada em ${arg1}/${arg2}`;
        }
        return Number(arg1) / Number(arg2);
    }
    if (op === '*') {
        return parseFloat((Number(arg1) * Number(arg2)).toFixed(3));
    }
    if (op === '%') {
        return Number(arg1) % Number(arg2);
    }
    if (op === '>') {
        return Number(arg1) > Number(arg2) ? 1 : 0;
    }
    if (op === '>=') {
        return Number(arg1) >= Number(arg2) ? 1 : 0;
    }
    if (op === '<') {
        return Number(arg1) < Number(arg2) ? 1 : 0;
    }
    if (op === '<=') {
        return Number(arg1) <= Number(arg2) ? 1 : 0;
    }
    if (op === '==') {
        return Number(arg1) == Number(arg2) ? 1 : 0;
    }
    if (op === '!=') {
        return Number(arg1) != Number(arg2) ? 1 : 0;
    }
    if (op === '&&') {
        return Number(arg1) && Number(arg2) ? 1 : 0;
    }
    if (op === '||') {
        return Number(arg1) || Number(arg2) ? 1 : 0;
    }
    if (op === 'sqrt'){
        return Number(Math.sqrt(arg1));
    }
    if (op === 'abs'){
        return Number(Math.abs(arg1));
    }
}

function verifica_se_eh_escopo(label){
    if (label.startsWith("#") && /^\#\d+$/.test(label)) {
        return true;
    } else {
        return false;
    }
}

function adiciona_funcao_a_pilha_de_funcao(funcao){
    if (!(funcao in globalVar.vm_funcoes)){
        globalVar.vm_funcoes[funcao] = {'escopos': []};
    }
}

export function inicializa_variaveis_globais(codigo_c3e){
    let esta_em_funcao = false;
    let c3e;
    let funcao;
    globalVar.vm_escopo = 0;  // variavel global
    globalVar.vm_escopo_pai = 0;
    for (let i = 0; i < codigo_c3e.length; i++) {
        c3e = codigo_c3e[i];
        if (c3e.escopo && c3e.label){
            globalVar.vm_escopo = parseInt(c3e.result.substring(1));
            if (c3e.result.substring(1) !== '0'){
                if (!(globalVar.vm_funcoes[funcao]['escopos'].includes(c3e.result.substring(1)))){
                    globalVar.vm_funcoes[funcao]['escopos'].push(c3e.result.substring(1));
                }
            }
        }
        if (c3e.salto && c3e.result == 'goto' && verifica_se_eh_chamada_de_funcao(c3e.arg1)){
            adiciona_funcao_a_pilha_de_funcao(c3e.arg1.substring(1));
        }
        if (c3e.label && verifica_se_eh_chamada_de_funcao(c3e.result)){
            adiciona_funcao_a_pilha_de_funcao(c3e.result.substring(1));
            setValue(0, c3e.result.substring(1), false, c3e.tipo_variavel);
            funcao = c3e.result.substring(1);
        }
        if (c3e.parametros){
            let parametros = c3e.result.split(',');
            for (let i=0; i < parametros.length; i++){
                if (verifica_se_eh_vetor(parametros[i])) {
                    let dados = extrai_variavel_e_posicao_vetor(parametros[i]);
                    let posicao = getValue(dados["posicao"]);
                    globalVar.variaveis_vm[globalVar.vm_escopo]['variaveis'][dados.variavel] = {
                        'valor': inicializa_vetor(dados['variavel'], posicao),
                        'tipo': c3e.parametros[parametros[i]].tipo
                    };
                } else if (verifica_se_eh_matriz(parametros[i])) {
                    let dados = extrai_variavel_e_posicao_matriz(parametros[i]);
                    let posicao1 = getValue(dados["posicoes"][0]);
                    let posicao2 = getValue(dados["posicoes"][0]);
                    globalVar.variaveis_vm[globalVar.vm_escopo]['variaveis'][dados.variavel] = {
                        'valor': inicializa_matriz(dados['variavel'], posicao1, posicao2),
                        'tipo': c3e.parametros[parametros[i]].tipo
                    };
                } else {
                    if (parametros[i]){
                        setValue(0, parametros[i], false, c3e.parametros[parametros[i]].tipo);
                        modifica_historico_variavel(parametros[i], 0);
                    }
                }
            }
        }
        if (globalVar.vm_escopo === 0 && !c3e.escopo && !c3e.salto && !c3e.escrita && !c3e.label && !c3e.leitura){
            let arg1 = getValue(c3e.arg1);
            if (!arg1){
                if (verifica_se_eh_vetor(c3e.result)) {
                    let dados = extrai_variavel_e_posicao_vetor(c3e.result);
                    inicializa_vetor(dados['variavel'], dados["posicao"]);
                    continue;
                } else if (verifica_se_eh_matriz(c3e.result)){
                    let dados = extrai_variavel_e_posicao_matriz(c3e.result);
                    inicializa_matriz(dados['variavel'], dados["posicoes"][0], dados["posicoes"][1]);
                } else {
                    if (c3e.result){
                        setValue(0, c3e.result, false, c3e.tipo_variavel);
                        modifica_historico_variavel(c3e.result, 0);
                    }
                }
            } else {
                let arg2 = '';
                if (c3e.arg2){
                    arg2 = getValue(c3e.arg2);
                }
                let result;
                if (c3e.op){
                    result = calcula_argumentos(arg1, arg2, c3e.op);
                } else {
                    result = arg1;
                }
                setValue(result, c3e.result, false);
                // modifica_historico_variavel(c3e.result, result);
            }

        }
    }
    globalVar.vm_escopo = 0;
}