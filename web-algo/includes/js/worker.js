/* jshint esversion: 6 */
import { globalVar } from './globals.js';
import { compiler } from './compiler.js';
import { executaC3E2 } from './maquina_virtual_2.js';

self.onmessage = function(event) {
  const { code } = event.data;
  const { debug } = event.data;
  globalVar.debug_compiler = debug;
  globalVar.worker = self;
  console.log('vai chamar compiler');
  let c3e = compiler(debug, code, self);
  if (c3e){
    executaC3E2(c3e.instrucoes, c3e.c3e, self);
  }
};