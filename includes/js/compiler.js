/* jshint esversion: 6 */
import { getToken, proxC } from './clexico.js';
import { Programa } from './csintatico.js';
import { globalVarC } from './cglobals.js';

function inicializa_compilacao(){
    globalVarC.code_position = -1;
    globalVarC.erro_lexico = false;
    // Limpa console
    globalVarC.count_column = 0;
    globalVarC.count_line = 1;
    globalVarC.dic_control['c3e'] = '';
    globalVarC.dic_control['msg_erro'] = '';
    globalVarC.dic_control['msg_warning'] = '';
    globalVarC.dic_control['printf'] = '';
    globalVarC.dic_control['encontrou_expressao'] = false;
    globalVarC.dic_control["encontrou_main"] = false;
    globalVarC.dic_control["bibliotecas"] = {};
    globalVarC.tabela_de_simbolos = [];
    globalVarC.instrucoes = [];
    globalVarC.tempCount = 0;
    globalVarC.labelCount = 0;
    globalVarC.identificador = '';
    globalVarC.lista_param_printf = [];
    globalVarC.flag_saida_escrita = true;
    globalVarC.obriga_return = false;
    globalVarC.achou_return = false;
    globalVarC.lista_parametros_func = [];
    globalVarC.empilha_operacao_aritmetica = [];
    globalVarC.verifica_vetor_matriz_numeral = true;
}


export function compiler(debug=false, codigo, worker){
    globalVarC.code = codigo;
    globalVarC.worker = worker;
    // if (vai_ler) {
    //     saveDataAndReload();
    // } else {
    //     localStorage.setItem('compilar', false);
    // }
    // $("#button2")[0].hidden = true;
    // $("#button3")[0].hidden = false;
    // Pega código digitado pelo usuário
    inicializa_compilacao();
    console.log(globalVarC.code);
    proxC();
    let c3e = [];

    // Teste analisador léxico e sintático
    getToken();
    try{
        if (Programa()) {
            // worker.postMessage({'saida_console': 'Léxico OK' + '\nSintático OK\n\n'});
            let contador = 1;
            globalVarC.instrucoes.forEach(inst => {
                if (inst.result) {
                    if (inst.salto || inst.label) {
                        console.log(`[${inst.linha}] ${inst.result} ${inst.arg1} ${inst.op} ${inst.arg2}`);
                        globalVarC.dic_control['c3e'] += `${contador}. ${inst.result} ${inst.arg1} ${inst.op} ${inst.arg2}\n`;
                    } else if (inst.escrita || inst.leitura) {
                        console.log(`[${inst.linha}] ${inst.result}`);
                        globalVarC.dic_control['c3e'] += `${contador}. ${inst.result}\n`;
                    } else if (inst.result && inst.arg1) {
                        console.log(`[${inst.linha}] ${inst.result} = ${inst.arg1} ${inst.op} ${inst.arg2}`);
                        globalVarC.dic_control['c3e'] += `${contador}. ${inst.result} = ${inst.arg1} ${inst.op} ${inst.arg2}\n`;
                    } else {
                        console.log(`[${inst.linha}] ${inst.result}`);
                        globalVarC.dic_control['c3e'] += `${contador}. ${inst.result}\n`;
                    }
                    contador += 1;
                }
            });
            return {'instrucoes': globalVarC.instrucoes, 'c3e': globalVarC.dic_control.c3e};
        } else {
            if (globalVarC.dic_control['msg_erro']){
                worker.postMessage({'saida_console': globalVarC.dic_control['msg_erro']});
            } else {
                if (!globalVarC.dic_control['encontrou_main']){
                    worker.postMessage({'saida_console': 'Não encontrou a função de entrada main'});
                }
            }
            worker.postMessage({'finalizou_execucao': true, 'c3e': ''});
            // $("#button4")[0].hidden = false;
            // $("#button5")[0].hidden = true;
            // $("#button2")[0].hidden = false;
            // $("#button3")[0].hidden = true;
            // $("#button6")[0].hidden = true;
            // $("#inputText")[0].disabled = true;
            // editor.setOption("readOnly", false);
        }
    } catch (e){
        console.log(e);

        worker.postMessage({'saida_console': globalVarC.dic_control['msg_erro']});
        worker.postMessage({'finalizou_execucao': true, 'c3e': ''});

        // $("#button4")[0].hidden = false;
        // $("#button5")[0].hidden = true;
        // $("#button2")[0].hidden = false;
        // $("#button3")[0].hidden = true;
        // $("#button6")[0].hidden = true;
        // $("#inputText")[0].disabled = true;
        // editor.setOption("readOnly", false);
    }
}