function startAdvancedTour() {
  introJs()
    .setOptions({
      steps: [
        {
          element: '.header',
          intro:
            '🎯 <strong>Olá!</strong><br>Bem-vindo ao app de exercícios de programação da UCS!<br/><br/>Aqui você vai praticar lógica, escrever código e acompanhar os resultados em tempo real.',
          position: 'bottom',
        },
        {
          element: '.question-content',
          intro:
            '📝 <strong>Questão</strong><br/>Aqui você encontra o enunciado da questão! <br/><br/> Leia com atenção antes de começar a resolver.',
          position: 'bottom',
        },
        {
          element: '.code-editor-container',
          intro:
            '👨‍💻 <strong>Código</strong><br/>Digite ou edite o código da sua solução aqui.<br/><br/>Você pode compilar e rodar quantas vezes quiser.',
          position: 'bottom',
        },
        {
          element: '.console-container',
          intro:
            '🚧 <strong>Resposta</strong><br/>O resultado da execução do seu código aparece aqui.<br/><br/>Se houver erros, você também verá as mensagens para corrigir.',
          position: 'bottom',
        },
        {
          element: '.variables-content',
          intro:
            '💨 <strong>Variáveis</strong><br/>Acompanhe os valores das variáveis em tempo real durante a execução.<br/><br/>Isso ajuda a entender melhor o funcionamento do programa.',
          position: 'bottom',
        },
        {
          element: '.c3e-content',
          intro:
            '🐱‍👤 <strong>C3E</strong><br/>Aqui você pode visualizar a execução detalhada do código, linha por linha.<br/><br/>Ideal para aprender como o programa funciona internamente.',
          position: 'bottom',
        },
      ],
      showBullets: true,
      prevLabel: 'Voltar',
      nextLabel: 'Avançar',
      doneLabel: '🎉 Finalizar',
    })
    .onbeforechange(function (targetElement) {
      const currentStep = this._currentStep

      switch (currentStep) {
        case 0:
          document.getElementById('questao-tab').click()
          break
        case 1:
          document.getElementById('questao-tab').click()
          break
        case 2:
          if (window.innerWidth < 768) {
            document.getElementById('codigo-tab').click()
          }
          break
        case 3:
          break
        case 4:
          document.getElementById('variaveis-tab').click()
          break
        case 5:
          document.getElementById('c3e-tab').click()
          break
      }

      return new Promise((resolve) => {
        setTimeout(resolve, 200)
      })
    })
    .onafterchange(function () {
      document
        .querySelectorAll('.introjs-helperLayer, .introjs-tooltip')
        .forEach((el) => {
          el.setAttribute('aria-hidden', 'true')
        })
    })
    .start()
}
