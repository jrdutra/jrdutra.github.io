        function executar() {
            const textArea = document.getElementById("textarea-book")
            let textoBook = textArea.value

            const textAreaComunicacao = document.getElementById("textarea-areacomunicacao")
            let textoComunicacao = textAreaComunicacao.value

            let linhas = textoBook.split(/\r?\n/)
            
            let linhasUteis = retornaLinhasUteis(linhas)

            let campos = lerCampos(linhasUteis, textoComunicacao)

            const checkOmitirZeros = document.getElementById("id-omitir")

            let textoResultado = ""
            for (let i = 0; i < campos.length; i++) {

                    regexSemInformacao = /^[0\s]+$/

                    if(checkOmitirZeros.checked){
                        if(!regexSemInformacao.test(campos[i].conteudo)){
                            //Constroi texto
                            textoResultado = textoResultado + retornaTextoLinhaExibicao(campos[i])
                        }
                    }else{
                        textoResultado = textoResultado + retornaTextoLinhaExibicao(campos[i])
                    }
            }
            
            let divResultado = document.getElementById("id-resultado")
            divResultado.innerHTML = textoResultado;
        }

        function retornaTextoLinhaExibicao(campo){
            let espacamento = ""
            for(let l = 0; l < campo.nivel; l++){
                espacamento = espacamento + "&nbsp";
            }
            let textoOcorrencia = parseInt(campo.ocorrencia) != -1 ? "[" + (parseInt(campo.ocorrencia)+1).toString() + " de " + campo.ocorrenciaTotal + "] " : ""
            let textoLinha =   "<br>" 
                                + espacamento
                                + textoOcorrencia
                                + campo.nome
                                + " = "
                                + campo.conteudo
            return textoLinha
        }

        function lerCampos(linhas, textoComunicacao){
            let campos = []
            let pivor = 0

            const regexSomenteNumeros = /^[0-9]+$/;

            for (let i = 0; i < linhas.length; i++) {

                if(!regexSomenteNumeros.test(linhas[i])){//Constroi campo se for um campo normal
                     
                    //Pega o conteúdo do campo
                     let conteudoCampo = textoComunicacao.substring(pivor, pivor + retornaTamanho(linhas[i]))
                     pivor = pivor + retornaTamanho(linhas[i])
                     let campo = new Campo()
                     campo.nome = retornaNome(linhas[i])
                     campo.tamanho = retornaTamanho(linhas[i])
                     campo.nivel = retornaNivel(linhas[i])
                     campo.ocorrencia = -1
                     campo.ocorrenciaTotal = -1
                     campo.conteudo = conteudoCampo
                     campos.push(campo)

                }else{//Quando encontra somente numeros, é porque se trata de ocorrências
                    
                    let listaOcorrencias = []

                    const regexDependingOn = /DEPENDING ON/
                    const regexCampoDependingOn = /DEPENDING ON ([A-Z]|[0-9]|-)+/

                    let numeroOcorrencia = 0
                    if(regexDependingOn.test(linhas[i + 1])){
                        let nomeCampoDependingOn = linhas[i + 1].match(regexCampoDependingOn)[0].replace("DEPENDING ON ","")
                       
                        let campoDependingOn = campos.filter(function(campo) {
                            if (campo.nome === nomeCampoDependingOn) {
                              return campo;
                            }
                        })[0];
                        
                        numeroOcorrencia = parseInt(campoDependingOn.conteudo)
                        i++ //avança um para pegar a primeira linha das ocorrencias
                    }else{
                        numeroOcorrencia = linhas[i]
                    }

                    let nivelPrimeiraOcorrencia = retornaNivel(linhas[i+1])
                    let nivelDemaisOcorrencia = nivelPrimeiraOcorrencia
                    let contadorCampoOcorrencias = 1
                    while(nivelPrimeiraOcorrencia == nivelDemaisOcorrencia){
                        listaOcorrencias.push(linhas[i+contadorCampoOcorrencias])
                        contadorCampoOcorrencias++
                        nivelDemaisOcorrencia = retornaNivel(linhas[i+contadorCampoOcorrencias])
                    }
                    i+=contadorCampoOcorrencias-1

                    //adiciona ocorrencias a lista principal
                    for(let j = 0; j < numeroOcorrencia; j++){
                        for(let k = 0; k < listaOcorrencias.length; k++){
                            //Pega o conteúdo do campo
                            let conteudoCampo = textoComunicacao.substring(pivor, pivor + retornaTamanho(listaOcorrencias[k]))
                            pivor = pivor + retornaTamanho(listaOcorrencias[k])
                            let campo = new Campo()
                            campo.nome = retornaNome(listaOcorrencias[k])
                            campo.tamanho = retornaTamanho(listaOcorrencias[k])
                            campo.nivel = retornaNivel(listaOcorrencias[k])
                            campo.ocorrencia = j
                            campo.ocorrenciaTotal = numeroOcorrencia
                            campo.conteudo = conteudoCampo
                            campos.push(campo)
                            //campos.push(listaOcorrencias[k] + " OCORRENCIA "+ j +" de "+ numeroOcorrencia)
                        }
                    }
                    listaOcorrencias = []

                }
            }
            return campos
        }

        function retornaLinhasUteis(linhas){
            let linhasUteis = []
            for (let i = 0; i < linhas.length; i++) {
                let linha = linhas[i]
                const regexCampo = /[0-9][0-9] ([A-Z]|[0-9]|-)+( )+PIC( )+((X\([0-9]+\))|(9\([0-9]+\)V[0-9]\([0-9]+\))|(9\([0-9]+\)V[0-9][0-9])|(9\([0-9]+\)V[0-9])|9\([0-9]+\))/
                const regexOcorrencias = new RegExp("OCCURS( )+[0-9]+( )+TIMES");
                const regexApenasNumero = new RegExp("[0-9]+");
                const regexDependingOn = /DEPENDING ON/
                const regexCampoDependingOn = /DEPENDING ON ([A-Z]|[0-9]|-)+/

                if(regexCampo.test(linha)){
                    linhasUteis.push(linha.match(regexCampo)[0])
                }

                //Se for multiplas ocorrencias
                if(regexOcorrencias.test(linha)){
                    let qtdOccurs = linha.match(regexOcorrencias)[0].match(regexApenasNumero)[0]
                    linhasUteis.push(qtdOccurs)

                    if(!regexDependingOn.test(linha)){
                        if(regexDependingOn.test(linhas[i+1])){
                            linha = linhas[i+1]
                        }
                    }

                    if(regexDependingOn.test(linha)){
                        let textoDependingOn = linha.match(regexCampoDependingOn)[0]
                        linhasUteis.push(textoDependingOn)
                    }
                    
                }
            }
            return linhasUteis;
        }

        function buscaLinhaPorNomeCampo(linhas, nomeCampo){
            const regexNomeCampo = new RegExp(nomeCampo)
            const regexComentario = /\*/
            for (let i = 0; i < linhas.length; i++) {
                let linha = linhas[i]
                if(regexNomeCampo.test(linha) && !regexComentario.test(linha)){
                    return linha
                }
            }
        }

        function retornaNivel(linha){
            try {
                const regexNivel = /^[0-9]+ /;
                let nivel = linha.match(regexNivel)[0]
                return nivel
              } catch (exceptionVar) {
                return -1
              }
        }

        function retornaNome(linha){
            try {
                const regexNome = /([A-Z]|[0-9]|-){4,}/
                let nome = linha.match(regexNome)[0]
                return nome
              } catch (exceptionVar) {
                return "ERRO_AO_BUSCAR_NOME"
              }
        }

        function retornaTamanho(linha){
            let tamanhoAlfaNumerico = /X\([0-9]+\)/
            let tamanhoInteiro = /9.[0-9]+./
            let tamanhoDecimal = /9.[0-9]+.[A-Z].+/

            let tamanho

            if(tamanhoAlfaNumerico.test(linha)){
                tamanho = linha.match(tamanhoAlfaNumerico)[0]
                const regexApenasNumero = new RegExp("[0-9]+");
                tamanho = tamanho.match(regexApenasNumero)[0]
                return parseInt(tamanho, 10)
            }

            if(tamanhoDecimal.test(linha)){
                tamanho = linha.match(tamanhoDecimal)[0]
                const regexApenasNumeroParenteses = /[0-9]+\)/;
                tamanhoInteiro = tamanho.substring(2).match(regexApenasNumeroParenteses)[0]
                tamanhoInteiro = tamanhoInteiro.slice(0, tamanhoInteiro.length - 1);

                //Calcular tamanho decimal
                tamanhoDecimal = tamanho.substring(5)
                let tamanhoDecimalNum = 0
                const regexTamanhoDecimal1 = /V9/;
                if(regexTamanhoDecimal1.test(tamanhoDecimal)){
                    tamanhoDecimalNum = 1
                }

                const regexTamanhoDecimal2 = /V99/;
                if(regexTamanhoDecimal2.test(tamanhoDecimal)){
                    tamanhoDecimalNum = 2
                }

                const regexTamanhoDecimalN = /V9\([0-9]+\)/;
                if(regexTamanhoDecimalN.test(tamanhoDecimal)){
                    tamanhoDecimal = tamanhoDecimal.match(regexTamanhoDecimalN)[0]
                    tamanhoDecimal = tamanhoDecimal.substring(2)
                    const regexApenasNumero = new RegExp("[0-9]+");
                    tamanhoDecimal = tamanhoDecimal.match(regexApenasNumero)[0]
                    tamanhoDecimalNum = parseInt(tamanhoDecimal,10)
                }

                let tamanhoDecimalTotal = parseInt(tamanhoInteiro, 10) + tamanhoDecimalNum
                //let tamanhoDecimalTotal = parseInt(tamanhoInteiro, 10)

                return tamanhoDecimalTotal
            }

            if(tamanhoInteiro.test(linha)){
                tamanho = linha.match(tamanhoInteiro)[0]
                tamanho = tamanho.substring(2)
                const regexApenasNumero = new RegExp("[0-9]+");
                tamanho = tamanho.match(regexApenasNumero)[0]
                return parseInt(tamanho, 10)
            }

            return 0
        }

        class Campo {
            constructor() {
                this.nome = null;
                this.tamanho = null;
                this.nivel = null;
                this.ocorrencia = null;
                this.ocorrenciaTotal = null;
                this.conteudo = null;
              }
            toString() {
                return `Nome: ${this.nome}, Tamanho: ${this.tamanho}, Nível: ${this.nivel}, Ocorrência: ${this.ocorrencia}, Ocorrência Total: ${this.ocorrenciaTotal}, Conteúdo: ${this.conteudo}`;
            }
        }