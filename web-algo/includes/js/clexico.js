/* jshint esversion: 6 */
import { globalVarC } from './cglobals.js';

// Função que busca o próximo caractér do código digitado pelo usuário
export function proxC(){
    globalVarC.count_column += 1;
    if (globalVarC.caracter === '\n'){
        globalVarC.count_column = 0;
        globalVarC.count_line += 1;
    }
    // Pegue o próximo caractere
    globalVarC.caracter = globalVarC.code.charAt(globalVarC.code_position + 1);
    globalVarC.code_position += 1;
}

export function getToken(){
	globalVarC.count_column_last = globalVarC.count_column;
	globalVarC.count_line_last = globalVarC.count_line;
    var fim = false;
    var estado = 0;
	var loopInfinito = false;
	globalVarC.lexico = '';
    while (!fim){
		globalVarC.lexico += globalVarC.caracter;
        switch (estado){
            case 0:
                if (globalVarC.regexIdentificador.test(globalVarC.caracter)){
                    proxC();
                    estado = 1;
                    break;
                }
                if (globalVarC.regexNumero.test(globalVarC.caracter)) { // verifica numero
                    proxC();
                    while (globalVarC.regexNumero.test(globalVarC.caracter)){
                        globalVarC.lexico += globalVarC.caracter;
	                	proxC();
                    }
                    if (globalVarC.caracter === '.'){ // double / float
						globalVarC.lexico += globalVarC.caracter;
						proxC();
						while (globalVarC.regexNumero.test(globalVarC.caracter)){
							globalVarC.lexico += globalVarC.caracter;
							proxC();
						}
						globalVarC.lexico += '\0';
						globalVarC.tk = globalVarC.TKs['TKCteDouble'];
						return;
					} else { // inteiro
						globalVarC.lexico += '\0';
						globalVarC.tk = globalVarC.TKs['TKCteInt'];
						return;
					}
                }
                if (globalVarC.caracter === ','){ // verifica ','
					globalVarC.lexico += '\0';
					proxC();
					globalVarC.tk = globalVarC.TKs['TKVirgula'];
					return;
				}
				if (globalVarC.caracter === '.'){ // verifica '.'
					globalVarC.lexico += '\0';
					proxC();
					globalVarC.tk = globalVarC.TKs['TKPonto'];
					return;
				}
				if (globalVarC.caracter === ':'){ // verifica ':'
					globalVarC.lexico += '\0';
					proxC();
					globalVarC.tk = globalVarC.TKs['TKDoisPontos'];
					return;
				}
				if (globalVarC.caracter === ';'){ // verifica ';'
					globalVarC.lexico += '\0';
					proxC();
					globalVarC.tk = globalVarC.TKs['TKPontoEVirgula'];
					return;
				}
				if (globalVarC.caracter === '('){ // verifica '('
					globalVarC.lexico += '\0';
					proxC();
					globalVarC.tk = globalVarC.TKs['TKAbreParenteses'];
					return;
				}
				if (globalVarC.caracter === ')'){ // verifica ')'
					globalVarC.lexico += '\0';
					proxC();
					globalVarC.tk = globalVarC.TKs['TKFechaParenteses'];
					return;
				}
				if (globalVarC.caracter === '['){ // verifica '['
					globalVarC.lexico += '\0';
					proxC();
					globalVarC.tk = globalVarC.TKs['TKAbreColchete'];
					return;
				}
				if (globalVarC.caracter === ']'){ // verifica ']'
					globalVarC.lexico += '\0';
					proxC();
					globalVarC.tk = globalVarC.TKs['TKFechaColchete'];
					return;
				}
				if (globalVarC.caracter === '{'){ // verifica '{'
					globalVarC.lexico += '\0';
					proxC();
					globalVarC.tk = globalVarC.TKs['TKAbreChaves'];
					return;
				}
				if (globalVarC.caracter === '}'){ // verifica '}'
					globalVarC.lexico += '\0';
					proxC();
					globalVarC.tk = globalVarC.TKs['TKFechaChaves'];
					return;
				}
                if (globalVarC.caracter === '+'){ // verifica '+' '+=' '++'
				    proxC();
					if (globalVarC.caracter === '+'){ // '++'
					   globalVarC.lexico += '+';
	     			   globalVarC.lexico += '\0';
					   proxC();
					   globalVarC.tk = globalVarC.TKs['TKDuploMais'];
					   return;
					} else if (globalVarC.caracter === '='){ // '+='
					   globalVarC.lexico += '=';
	     			   globalVarC.lexico += '\0';
					   proxC();
					   globalVarC.tk = globalVarC.TKs['TKMaisIgual'];
					   return;
					} else { // '+'
		               globalVarC.lexico += '\0';
					   globalVarC.tk = globalVarC.TKs['TKMais'];
					   return;
					}
				}
                if (globalVarC.caracter === '-'){ // verifica '-' '-=' '--'
					proxC();
					if (globalVarC.caracter === '-'){ // '--'
						globalVarC.lexico += '-';
						globalVarC.lexico += '\0';
						proxC();
						globalVarC.tk = globalVarC.TKs['TKDuploMenos'];
						return;
					} else if (globalVarC.caracter === '=') { // '-='
						globalVarC.lexico += '=';
						globalVarC.lexico += '\0';
						proxC();
						globalVarC.tk = globalVarC.TKs['TKMenosIgual'];
						return;
					} else { // '-'
						globalVarC.lexico += '\0';
						globalVarC.tk = globalVarC.TKs['TKMenos'];
						return;
					}
				}
                if (globalVarC.caracter === '*') { // verifica '*' '*='
				 	proxC();
	             	if (globalVarC.caracter === '='){ // '*='
	             		globalVarC.lexico += '=';
	     			    globalVarC.lexico += '\0';
				 		proxC();
				 		globalVarC.tk = globalVarC.TKs['TKMultIgual'];
				 		return;
					} else { // '*'
						globalVarC.lexico += '\0';
				 		globalVarC.tk = globalVarC.TKs['TKMult'];
				 		return;
					}
				}
                if (globalVarC.caracter === '/') { // verifica '/' '/='
				 	proxC();
	             	if (globalVarC.caracter === '=') { // '/='
						globalVarC.lexico += '=';
						globalVarC.lexico += '\0';
						proxC();
						globalVarC.tk = globalVarC.TKs['TKDivIgual'];
						return;
					} else if (globalVarC.caracter === '*') {
						globalVarC.lexico += '*';
						proxC();
						estado = 3;
						break;
					// } else if (globalVarC.caracter === '/'){
					// 	 globalVarC.lexico += '/';
					// 	 proxC();
					// 	 estado = 3;
					// 	 break;
					} else { // '/'
						globalVarC.lexico += '\0';
				 		globalVarC.tk = globalVarC.TKs['TKDiv'];
				 		return;
					}
				}
                if (globalVarC.caracter === '%') { // verifica '%' '%='
				 	proxC();
	             	if (globalVarC.caracter === '='){ // '%='
	             		globalVarC.lexico += '=';
	     			    globalVarC.lexico += '\0';
				 		proxC();
				 		globalVarC.tk = globalVarC.TKs['TKRestoIgual'];
				 		return;
					} else { // '%'
						globalVarC.lexico += '\0';
				 		globalVarC.tk = globalVarC.TKs['TKResto'];
				 		return;
					}
				}
                if (globalVarC.caracter === '='){ // verifica '=' '=='
					proxC();
					if (globalVarC.caracter === '='){ // '=='
						globalVarC.lexico += '=';
						proxC();
						globalVarC.tk = globalVarC.TKs['TKCompare'];
						return;
					} else { // '='
						globalVarC.lexico += '\0';
						globalVarC.tk = globalVarC.TKs['TKIgual'];
						return;
					}
				}
				if (globalVarC.caracter === '!'){ // verifica '!' '!='
					proxC();
				 	if (globalVarC.caracter === '='){ // '!='
						globalVarC.lexico += '=';
	     			    globalVarC.lexico += '\0';
					    proxC();
					    globalVarC.tk = globalVarC.TKs['TKDiferent'];
					    return;
					} else { // '!'
						globalVarC.lexico += '\0';
						globalVarC.tk = globalVarC.TKs['TKLogicalNot'];
					    return;
					}
				}
				if (globalVarC.caracter === '<'){ // verifica '<' '<='
				 	proxC();
					if (globalVarC.caracter === '=') { // '<='
						globalVarC.lexico += '=';
						globalVarC.lexico += '\0';
						proxC();
						globalVarC.tk = globalVarC.TKs['TKMenorIgual'];
						return;
					} else if (globalVarC.regexIdentificador.test(globalVarC.caracter) && (globalVarC.caracter === 's' || globalVarC.caracter === 'm')){
						while (globalVarC.regexIdentificador.test(globalVarC.caracter)){
							globalVarC.lexico += globalVarC.caracter;
							proxC();
						}
						if (globalVarC.lexico === '<stdio' || globalVarC.lexico === '<math'){
							if (globalVarC.caracter === '.'){
								globalVarC.lexico += globalVarC.caracter;
								proxC();
								if (globalVarC.caracter === 'h'){
									globalVarC.lexico += globalVarC.caracter;
									proxC();
									if (globalVarC.caracter === '>'){
										globalVarC.lexico += globalVarC.caracter;
										proxC();
										if (globalVarC.lexico === '<stdio.h>'){
											globalVarC.tk = globalVarC.TKs['TKStdioh'];
										} else {
											globalVarC.tk = globalVarC.TKs['TKMathh'];
										}
										return;
									}
								}
							}
						}
						globalVarC.dic_control['msg_erro'] = 'ERRO: token ' + globalVarC.lexico + ' não identificado (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
						globalVarC.erro_lexico = true;
						globalVarC.worker.postMessage({'saida_console': globalVarC.dic_control['msg_erro']});
						globalVarC.worker.postMessage({'finalizou_execucao': true, 'c3e': ''});

					} else { // '<'
						globalVarC.lexico += '\0';
						globalVarC.tk = globalVarC.TKs['TKMenor'];
					    return;
					}
				}
				if (globalVarC.caracter === '>'){ // verifica '>' '>='
					proxC();
					if (globalVarC.caracter === '='){ // '>='
						globalVarC.lexico += '=';
	     			    globalVarC.lexico += '\0';
					    proxC();
					    globalVarC.tk = globalVarC.TKs['TKMaiorIgual'];
					    return;
					} else { // >
						globalVarC.lexico += '\0';
						globalVarC.tk = globalVarC.TKs['TKMaior'];
					    return;
					}
				}
				if (globalVarC.caracter === '&'){ // verifica '&&' e '&'
	             	proxC();
	             	if (globalVarC.caracter === '&'){ // '&&'
	             		globalVarC.lexico += '&';
	     			    globalVarC.lexico += '\0';
				 		proxC();
				 		globalVarC.tk = globalVarC.TKs['TKLogicalAnd'];
				 		return;
					} else { // '&'
						globalVarC.lexico += '\0';
				 		globalVarC.tk = globalVarC.TKs['TKEnderecoVariavel'];
				 		return;
					}
				}
				if (globalVarC.caracter === '|'){ // verifica '||'
	             	proxC();
	             	if (globalVarC.caracter === '|'){ // ||
	             		globalVarC.lexico += '|';
	     			    globalVarC.lexico += '\0';
				 		proxC();
				 		globalVarC.tk = globalVarC.TKs['TKLogicalOr'];
				 		return;
					}
				}
				if (globalVarC.caracter === '#'){ // verifica '#'
					proxC();
					while (globalVarC.regexIdentificador.test(globalVarC.caracter)){
                        globalVarC.lexico += globalVarC.caracter;
	                	proxC();
                    }
					if (globalVarC.lexico === '#define'){
						proxC();
						globalVarC.tk = globalVarC.TKs['TKDefine'];
						return;
					} else if (globalVarC.lexico === '#include'){
						globalVarC.tk = globalVarC.TKs['TKInclude'];
						return;
					} else {
						globalVarC.dic_control['msg_erro'] = 'ERRO: token ' + globalVarC.lexico + ' não identificado (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
						globalVarC.erro_lexico = true;
						globalVarC.worker.postMessage({'saida_console': globalVarC.dic_control['msg_erro']});
						globalVarC.worker.postMessage({'finalizou_execucao': true, 'c3e': ''});
					}
				}
				if (globalVarC.caracter === '"'){ // verifica '"'
					proxC();
					estado = 2;
					break;
				}
				if (globalVarC.caracter === "'"){ // verifica '"'
					proxC();
					estado = 4;
					break;
				}
				if (globalVarC.caracter === '\n' || globalVarC.caracter === '\t' || globalVarC.caracter === ' '){
					globalVarC.lexico = globalVarC.lexico.slice(0, -1);
					proxC();
					break;
				}
				if (globalVarC.code.length === globalVarC.code_position){
					globalVarC.tk = -1;
					return true;
				}
				globalVarC.dic_control['msg_erro'] = 'ERRO: token ' + globalVarC.lexico + ' não identificado (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
				globalVarC.erro_lexico = true;
				globalVarC.worker.postMessage({'saida_console': globalVarC.dic_control['msg_erro']});
				globalVarC.worker.postMessage({'finalizou_execucao': true, 'c3e': ''});
			// Token
            case 1:
                if (globalVarC.regexIdentificadorNumero.test(globalVarC.caracter)){
                    proxC();
					break;
                }
				if (globalVarC.caracter === '"') { // verifica '"'
					globalVarC.lexico += '"';
					globalVarC.lexico += '\0';
					proxC();
					globalVarC.tk = globalVarC.TKs['TKStringStdio'];
					break;
				}

				globalVarC.lexico = globalVarC.lexico.slice(0, -1);
				globalVarC.tk = globalVarC.reserved_words[globalVarC.lexico.replace(/\s/g, '')];
				if (typeof globalVarC.tk === 'undefined') {
					globalVarC.tk = globalVarC.TKs['TKId'];
				}
				globalVarC.lexico += '\0';
				return;

			// String Stdio
			case 2:
				if (globalVarC.caracter === '%'){  // verifica parametro float, double ou int
					proxC();
					globalVarC.lexico += globalVarC.caracter;
					if (globalVarC.caracter === 'd'){  // integer
						globalVarC.lista_param_printf.push('int');
						proxC();
						break;
					}
					if (globalVarC.caracter === 'f'){  // float
						globalVarC.lista_param_printf.push('float');
						proxC();
						break;
					}
					if (globalVarC.caracter === '.'){  //
						proxC();
						let contador = 1;
						while (globalVarC.regexNumero.test(globalVarC.caracter)){
							globalVarC.lexico += globalVarC.caracter;
							proxC();
							contador++;
						}
						if (globalVarC.caracter === 'f'){  // float
							globalVarC.lexico += globalVarC.caracter;
							globalVarC.lista_param_printf.push('float');
							proxC();
							break;
						}
						if (globalVarC.caracter === 'd'){  // integer
							globalVarC.lexico = globalVarC.lexico.slice(0, -contador);
							globalVarC.lexico += globalVarC.caracter;
							globalVarC.lista_param_printf.push('int');
							proxC();
							break;
						}
					}
					globalVarC.dic_control['msg_erro'] = 'Erro encontrado na expressão %' + globalVarC.caracter + '. Conversão de tipo desconhecida. (' + globalVarC.count_line + ', ' + globalVarC.count_column + ')' + '\n';
					globalVarC.erro_lexico = true;
					throw 'Erro léxico';
				}
				if (globalVarC.caracter === ' '){
					proxC();
					break;
				}
				if (globalVarC.caracter.includes("\\") ){
					proxC();
					globalVarC.lexico += globalVarC.caracter;
					if (globalVarC.caracter === 'n' || globalVarC.caracter === 't'){
						proxC();
						break;
					}
				}
				if (globalVarC.caracter === '"') { // verifica '"'
					globalVarC.lexico += '\0';
					globalVarC.tk = globalVarC.TKs['TKStringStdio'];
					proxC();
					return;
				}
				if (loopInfinito){
					return;
				}
				if (globalVarC.code.length === globalVarC.code_position){
					loopInfinito = true;
				}
				proxC();
				break;
			// Comentário
			case 3:
				if (globalVarC.caracter === '*') {
					proxC();
					if (globalVarC.caracter === '/') {
						proxC();
						return getToken();
					}
				// } else if (globalVarC.caracter === '\n'){
				// 	proxC();
				// 	return getToken();
				} else if (globalVarC.caracter === ''){
					return getToken();
				} else {
					proxC();
					break;
				}

			// String Stdio
			case 4:
				if (globalVarC.regexAscii.test(globalVarC.caracter)){
					if (globalVarC.caracter === "'") { // verifica '"'
						globalVarC.lexico += '\0';
						globalVarC.tk = globalVarC.TKs['TKString'];
						proxC();
						return;
					}
					proxC();
					break;
				}
				if (loopInfinito){
					return;
				}
				if (globalVarC.code.length === globalVarC.code_position){
					loopInfinito = true;
				}
				proxC();
				break;
        }
    }
}