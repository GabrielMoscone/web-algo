/* jshint esversion: 6 */
export var globalVar = {
    // VM //////////////////////////////////////////////////////////////////////////////////////////////////////////////
    vm_escopo: '',
    vm_escopo_pai: '',
    variaveis_vm: {},
    vm_escopos: {},
    parametros_chamadas_funcao: [],
    pilha_funcoes: [],
    vm_funcoes: {},
    index_goto: {},
    debug_compiler: false,
    linha_atual: 0,
    linha_anterior: 0,
    vai_ler: false,
    historico_variaveis: {},
    warning_msg: '',
    worker: '',
    regexNumero: /^-?\d+(\.\d+)?$/,
    regexNumeroInteiro: /^-?\d+$/,
    index: 0,
    linha: '',
    ativa_proximo_passo: false,
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
};