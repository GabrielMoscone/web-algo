/* jshint esversion: 6 */
import { globalVar } from './globals.js';
import { inicializa_escopos, indexa_linhas, inicializa_variaveis_globais, getUserDebug,
    verifica_se_eh_return, verifica_temporaria, getValue, setValue, realiza_atribuicao_parametros, altera_escopo_pai,
    verifica_se_eh_chamada_de_funcao, carrega_parametros, empilha_variaveis_recursao, parsePrintf,
    formataString, formataStringQuebraLinha, parseScanf, getUserInput, verifica_se_eh_vetor,
    extrai_variavel_e_posicao_vetor, inicializa_vetor, verifica_se_eh_matriz, extrai_variavel_e_posicao_matriz,
    inicializa_matriz, calcula_argumentos} from './funcoes_mv.js';

export async function executaC3E2(codigo_c3e, c3e_txt, worker) {
    globalVar.worker = worker;
    let c3e;
    let result;
    let arg1;
    let arg2;
    let qtd_escopos = codigo_c3e.shift();
    let returns = [];
    let qtd_operacoes = 0;
    globalVar.vm_funcoes = [];
    globalVar.pilha_funcoes = [];
    globalVar.variaveis_vm = [];
    globalVar.vm_escopos = [];
    globalVar.parametros_chamadas_funcao = [];
    globalVar.index_goto = {};
    globalVar.linha_anterior = 0;
    globalVar.historico_variaveis = {};
    globalVar.warning_msg = '';
    inicializa_escopos(qtd_escopos.result);
    indexa_linhas(codigo_c3e);
    inicializa_variaveis_globais(codigo_c3e);
    try {
        for (let i = 0; i < codigo_c3e.length; i++) {
            qtd_operacoes += 1;
            c3e = codigo_c3e[i];
            globalVar.linha = c3e.linha;
            if (c3e.result) {
                // DEPURADOR
                if (globalVar.debug_compiler && (globalVar.debug_compiler.includes(c3e.linha) || globalVar.ativa_proximo_passo || c3e.leitura)) {
                    if (c3e.leitura){
                        worker.postMessage({'debugger': false, 'linha_atual': c3e.linha, 'linha_anterior': globalVar.linha_anterior});
                        globalVar.linha_anterior = c3e.linha;
                    } else {
                        if (globalVar.linha_anterior !== c3e.linha && !c3e.label && !c3e.escopo) {
                            // globalVar.vai_ler = true;
                            globalVar.linha_atual = c3e.linha;
                            await getUserDebug(worker);
                            // globalVar.vai_ler = false;
                            globalVar.linha_anterior = c3e.linha;
                        }
                    }
                }
                if (c3e.escopo) {
                    if (Number(c3e.result.substring(1)) === 0) {
                        globalVar.vm_escopo_pai = 0;
                        globalVar.vm_escopo = 0;
                    } else {
                        let escopo_atual = Number(c3e.result.substring(1));
                        if (codigo_c3e[i+1].salto && verifica_se_eh_return(codigo_c3e[i+1].result)){
                            if (verifica_temporaria(codigo_c3e[i+1].arg1)){
                                arg1 = getValue(codigo_c3e[i+1].arg1);
                                setValue(arg1, globalVar.pilha_funcoes[globalVar.pilha_funcoes.length - 1].substring(1));
                            }
                        }
                        if (Number(c3e.result.substring(1)) in globalVar.vm_escopos) {
                            globalVar.vm_escopo_pai = globalVar.vm_escopos[escopo_atual]['escopo_pai'];
                            globalVar.vm_escopo = escopo_atual;
                        } else {
                            globalVar.vm_escopo_pai = globalVar.vm_escopo;
                            globalVar.vm_escopo = Number(c3e.result.substring(1));
                            globalVar.vm_escopos[escopo_atual] = {'escopo_pai': globalVar.vm_escopo_pai};
                            altera_escopo_pai();
                        }
                    }
                    continue;
                } else if (c3e.parametros) {
                    let parametros = globalVar.parametros_chamadas_funcao.pop();
                    realiza_atribuicao_parametros(c3e.result.split(','), parametros, c3e.parametros, c3e.linha);
                } else if (c3e.label) {
                    continue;
                } else if (c3e.salto) {
                    // SALTO INCODICIONAL
                    if (c3e.result === 'goto') {
                        if (verifica_se_eh_chamada_de_funcao(c3e.arg1)) {
                            if (c3e.arg2) {
                                globalVar.parametros_chamadas_funcao.push(carrega_parametros(c3e.arg2.split(',')));
                            }
                            returns.push({
                                'index': i,
                                'identificador': c3e.arg1.substring(1),
                                'escopo_pai': globalVar.vm_escopo_pai,
                                'escopo': globalVar.vm_escopo,
                                'tipo_variavel': c3e.tipo_variavel
                            });
                            if (!(Number(codigo_c3e[globalVar.index_goto[c3e.arg1] + 1].result.substring(1)) in globalVar.vm_escopos)) {
                                globalVar.vm_escopo_pai = 0;
                                globalVar.vm_escopo = Number(codigo_c3e[globalVar.index_goto[c3e.arg1] + 1].result.substring(1));
                                globalVar.vm_escopos[globalVar.vm_escopo] = {'escopo_pai': globalVar.vm_escopo_pai};
                                altera_escopo_pai();
                            } else {

                                if (c3e.arg1 === globalVar.pilha_funcoes[globalVar.pilha_funcoes.length - 1]) {
                                    for (let i=0; i<globalVar.vm_funcoes[c3e.arg1.substring(1)]['escopos'].length; i++){
                                        // empilha variaveis de chamada recursiva no mesmo escopo
                                        empilha_variaveis_recursao(Number(globalVar.vm_funcoes[c3e.arg1.substring(1)]['escopos'][i]));
                                    }
                                }
                            }
                            globalVar.pilha_funcoes.push(c3e.arg1);
                        }
                        i = globalVar.index_goto[c3e.arg1] - 1;
                        continue;
                    } else if (verifica_se_eh_return(c3e.result)) {
                        // RETURN
                        if (c3e.arg1) {
                            let dados = returns.pop();
                            // desempilha recursão caso houver
                            for (let i=0; i<globalVar.vm_funcoes[dados.identificador]['escopos'].length; i++){
                                let escopo_atual = globalVar.vm_funcoes[dados.identificador]['escopos'][i];
                                if ('recursao' in globalVar.variaveis_vm[escopo_atual] && globalVar.variaveis_vm[escopo_atual]['recursao'].length > 0) {
                                    globalVar.variaveis_vm[escopo_atual]['variaveis'] = globalVar.variaveis_vm[escopo_atual]['recursao'].pop();
                                }
                            }

                            globalVar.vm_escopo = dados['escopo'];
                            globalVar.vm_escopo_pai = dados['escopo_pai'];
                            if (!verifica_temporaria(c3e.arg1)) {
                                arg1 = getValue(c3e.arg1);
                                result = arg1;
                            }
                            globalVar.vm_escopo = 0;
                            globalVar.vm_escopo_pai = 0;
                            if (!verifica_temporaria(c3e.arg1)) {
                                setValue(result, dados['identificador'], true, dados['tipo_variavel']);
                            }
                            globalVar.vm_escopo = dados['escopo'];
                            globalVar.vm_escopo_pai = dados['escopo_pai'];
                            globalVar.pilha_funcoes.pop();
                            if (dados['identificador'] != 'main') {
                                i = dados['index'];
                            }
                        }
                        continue;
                    } else {
                        // SALTO CONDICIONAL
                        let condicional = getValue(c3e.arg1);
                        if (!condicional) {
                            i = globalVar.index_goto[c3e.arg2] - 1;
                            continue;
                        }
                    }
                } else if (c3e.escrita) {
                    globalVar.index = 0;
                    let quebra_printf = parsePrintf(c3e.result);
                    let parametros = quebra_printf.params.slice(1);
                    // let formatarString = formataStringInt(quebra_printf.formattedString, parametros, c3e.linha);
                    let formatarString = formataString(quebra_printf.formattedString, parametros, c3e.linha);
                    formatarString = formataStringQuebraLinha(formatarString);
                    worker.postMessage({'saida_console': formatarString.replace(/"/g, '')});
                } else if (c3e.leitura) {
                    let quebra_scanf = parseScanf(c3e.result);
                    let values = quebra_scanf.params;
                    for (let i = 0; i < values.length; i++) {
                        //configura_leitura(true, worker);
                        let userInput = await getUserInput(worker, values[i]);
                        //configura_leitura(false, worker);
                        setValue(userInput, values[i]);
                    }
                } else {
                    if (!c3e.arg1) {
                        if (verifica_se_eh_vetor(c3e.result)) {
                            let dados = extrai_variavel_e_posicao_vetor(c3e.result);
                            let posicao = getValue(dados["posicao"]);
                            globalVar.variaveis_vm[globalVar.vm_escopo]['variaveis'][dados.variavel] = {
                                'valor': inicializa_vetor(dados['variavel'], posicao),
                                'tipo': c3e.tipo_variavel
                            };
                        } else if (verifica_se_eh_matriz(c3e.result)) {
                            let dados = extrai_variavel_e_posicao_matriz(c3e.result);
                            let posicao1 = getValue(dados["posicoes"][0]);
                            let posicao2 = getValue(dados["posicoes"][0]);
                            globalVar.variaveis_vm[globalVar.vm_escopo]['variaveis'][dados.variavel] = {
                                'valor': inicializa_matriz(dados['variavel'], posicao1, posicao2),
                                'tipo': c3e.tipo_variavel
                            };
                        } else {
                            setValue(0, c3e.result, false, c3e.tipo_variavel);
                        }
                    } else {
                        arg1 = getValue(c3e.arg1);
                        arg2 = '';
                        if (c3e.arg2) {
                            arg2 = getValue(c3e.arg2);
                        }
                        if (c3e.op) {
                            result = calcula_argumentos(arg1, arg2, c3e.op);
                        } else {
                            result = arg1;
                        }
                        setValue(result, c3e.result);
                    }
                }
            }
        }
        if (globalVar.warning_msg){
            worker.postMessage({'saida_console': globalVar.warning_msg});
        }
        worker.postMessage({'saida_console': '\n\nPrograma compilado e executado com sucesso.'});
        worker.postMessage({'saida_console': `\nO programa executado gerou um custo de: ${qtd_operacoes}.`});
        worker.postMessage({'finalizou_execucao': true, 'c3e': c3e_txt});

    } catch (e){
        worker.postMessage({'saida_console': '\n\n' + e});
        worker.postMessage({'finalizou_execucao': true, 'c3e': c3e_txt});
    }
    return;
}