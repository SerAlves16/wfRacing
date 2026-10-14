//--------------------------------------------DECLARAÇÕES VARIAVEIS---------------------------------------------------------

let popupAberto = false;
let popup2Aberto = false;
let popupNumpadAberto = false;
let popupNumpadPasswordAberto = false;
let popupRodaDentada = false;
let popupConfiguracoes = false;
let popupFiltros = false;
let popupAdicionaObs = false;

// Gravar os detalhes da curva (se é Post ou Turn)
let detalheCurva = "NaN";
let detalheCorrida = 0;
// Atualizar o relógio a cada segundo
setInterval(updateClock, 1000);

//Verificar se o campo de pesquisa esta ativo
let campoPesquisa = false;

//Declarado URL's
const url = window.WFR_API_BASE;

//-------------------------------------------------------DOC LISTENERS--------------------------------------------------------

//VALIDAÇÃO DE TOKEN!!!!!!!
document.addEventListener("DOMContentLoaded", function () {
  // Verifica se a variável responseData existe na localStorage
  const responseData = localStorage.getItem("responseData");
  let userData;
  try { userData = JSON.parse(responseData); } catch { localStorage.removeItem('responseData'); }
  if (!userData?.token) { window.location.replace('/index.html'); return; }
  fetch('/auth/protected').then(response => response.ok ? response.json() : null).then(data => {
    if (data?.user) localStorage.setItem('usertype', data.user.usertype);
  });
  if (!responseData) {
    // Se a variável responseData não existir, redirecione o usuário para index.html
    window.location.href = "/index.html";
  }

  localStorage.setItem("usertype", userData.usertype);
  updateHeaderWithLastRaceText();

  var posicaoScroll = localStorage.getItem("posicaoScroll");
  if (posicaoScroll) {
    setTimeout(() => {
      window.scrollTo(0, posicaoScroll);
    }, 100);
  }
  console.log(posicaoScroll);
});

// função que é ativada antes da página ser desligada
window.onbeforeunload = function (e) {
  localStorage.setItem("posicaoScroll", window.scrollY); // Guarda a posição na página do eixo vertical (Y)
};

// Definir se o campo de pesquisa está selecionado ou não
document.addEventListener("DOMContentLoaded", function () {
  loadPesquisaChoice();
  const pesquisaField = document.getElementById("pesquisa");
  if (!pesquisaField) {
    console.log("Campo não encontrado");
  } else {
    pesquisaField.addEventListener("focus", function () {
      console.log("focused on it");
      campoPesquisa = true;
    });
    pesquisaField.addEventListener("focusout", function () {
      console.log("unfocused on it");
      campoPesquisa = false;
    });
  }
});

// Impedir o refresh quando ao campo de pesquisa se encontra selecionado
// Chamar a função atualizarPagina a cada 5 segundos
setInterval(atualizarPagina, 1000);

// Valor para o segundo input numérico no numpad
document.addEventListener("keydown", function (e) {
  if (popupNumpadAberto == true) {
    let curvaInput = document.getElementById("curvaInput");
    const maxCurvas = localStorage.getItem("numCurvasBD");
    console.log(maxCurvas);
    if (
      e.key == 0 ||
      e.key == 1 ||
      e.key == 2 ||
      e.key == 3 ||
      e.key == 4 ||
      e.key == 5 ||
      e.key == 6 ||
      e.key == 7 ||
      e.key == 8 ||
      e.key == 9
    ) {
      curvaInput.value += `${e.key}`;
      if (Number(curvaInput.value) > maxCurvas) {
        curvaInput.value = String(maxCurvas);
      }
    }
  }
});

//Atalhos para o numpad (no numpad físico) até 9
document.addEventListener("keydown", function (e) {
  //Vai buscar o numero currente de curvas definido
  const numpadNumbers = localStorage.getItem("numCurvasBD");

  // Caso nenhum dos popus estejam abertos
  if (
    popupAberto == false &&
    popup2Aberto == false &&
    popupNumpadAberto == false &&
    popupNumpadPasswordAberto == false &&
    popupRodaDentada == false &&
    popupConfiguracoes == false &&
    campoPesquisa == false
  ) {
    for (let i = 1; i <= numpadNumbers; i++) {
      if (e.key === `${i}`) {
        abrirPopupNumpad();
        abrirPopup();
        obterHoraAtual();
        obterCurvaNum(i);
      }
    }
  }

  if (e.key === "Escape") {
    fecharPopup();
    fecharPopupNumpad();
    fecharPopup2();
    fecharPopupNumpadPassword();
  }
});

//
document.addEventListener("keydown", function (e) {
  if (
    popupAberto == false &&
    popup2Aberto == false &&
    popupNumpadAberto == false &&
    popupNumpadPasswordAberto == false &&
    popupRodaDentada == false &&
    popupConfiguracoes == false &&
    campoPesquisa == false
  ) {
    const corridaNumber = Number(localStorage.getItem("numCorridas"));
    const userType = localStorage.getItem("usertype");
    let corrida;

    if (corridaNumber != null || corridaNumber != "") {
      corrida = corridaNumber;
    } else {
      corrida = 1;
    }
    if (document.readyState == "complete" && userType != "user") {
      setTimeout(() => {
        if (e.key === "p" || e.key === "P") {
          document.getElementById("curvaInput").value = "Start";
          obterHoraAtual();
          adicionarLinha();
        } else if (e.key === "r" || e.key === "R") {
          document.getElementById("curvaInput").value = "Red Flag";
          obterHoraAtual();
          adicionarLinha();
        } else if (e.key === "s" || e.key === "S") {
          document.getElementById("curvaInput").value = "Slow Flag";
          obterHoraAtual();
          adicionarLinha();
        }
      }, 300);
    }
  }
});

//
document.addEventListener("DOMContentLoaded", function () {
  // é necessário um pequeno delay para a local storage atualizar devidamente
  setTimeout(() => {
    const dadosExistentes = localStorage.getItem("dadosTabela");
    const data = JSON.parse(dadosExistentes);
    //filtrarPorStart();
    let registo = 1;
    if (data != null) {
      data.forEach((item) => {
        registo++;
      });
    }
    localStorage.setItem("Numero de Registos", registo);
  }, 1000); // 1 second delay
});

//Verifica a nao validação de NFA e Report
document.addEventListener("DOMContentLoaded", function () {
  const reportCheckbox = document.getElementById("reportCheck2");
  const nfaCheckbox = document.getElementById("nfacheck2");

  reportCheckbox.addEventListener("click", function () {
    if (this.checked && nfaCheckbox.checked) {
      /*alert(
        "Erro: Não é possível selecionar 'Report' e 'NFA' simultaneamente."
      );*/
      nfaCheckbox.checked = false; // Desmarca o checkbox "NFA"
    }
  });

  nfaCheckbox.addEventListener("click", function () {
    if (this.checked && reportCheckbox.checked) {
      /*alert(
        "Erro: Não é possível selecionar 'NFA' e 'Report' simultaneamente."
      );*/
      reportCheckbox.checked = false; // Desmarca o checkbox "Report"
    }
  });
});

//
document.addEventListener("DOMContentLoaded", function () {
  const horaInput = document.getElementById("horainput2");

  // Adiciona um evento de alteração ao campo de entrada de hora
  horaInput.addEventListener("change", function () {
    let inputValue = this.value;

    // Substitui o ponto por 0
    inputValue = inputValue.replace(/\./g, "0");

    // Remove quaisquer caracteres não numéricos do valor de entrada
    inputValue = inputValue.replace(/\D/g, "");

    // Verifica se o valor de entrada tem exatamente 6 caracteres
    if (inputValue.length === 6) {
      // Extrai as partes da hora (horas, minutos e segundos) do valor de entrada
      const hours = inputValue.substring(0, 2);
      let minutes = inputValue.substring(2, 4);
      let seconds = inputValue.substring(4, 6);

      // Converte para números inteiros
      minutes = parseInt(minutes);
      seconds = parseInt(seconds);

      // Ajusta os minutos e segundos para manterem-se dentro do intervalo de 0 a 59
      minutes = Math.min(minutes, 59);
      seconds = Math.min(seconds, 59);

      // Formata os minutos e segundos para terem dois dígitos
      minutes = minutes.toString().padStart(2, "0");
      seconds = seconds.toString().padStart(2, "0");

      // Formata o valor de entrada para o formato xx:xx:xx
      inputValue = hours + ":" + minutes + ":" + seconds;
    } else if (inputValue.length === 5) {
      // Se o valor de entrada tem 5 caracteres, assumimos que está no formato "HHMM"
      const hours = inputValue.substring(0, 2);
      let minutes = inputValue.substring(2, 3);
      let seconds = inputValue.substring(3, 5);

      // Ajusta os minutos e segundos para terem dois dígitos
      minutes = minutes.padStart(2, "0");
      seconds = seconds.padStart(2, "0");

      // Formata o valor de entrada para o formato xx:xx:xx
      inputValue = hours + ":" + minutes + ":" + seconds;
    }

    // Define o valor formatado de volta ao campo de entrada
    this.value = inputValue;
  });
});

// Certifique-se de que a função carregarDados() é chamada após o carregamento da página
document.addEventListener("DOMContentLoaded", function () {
  carregarDados();
  carregarDadosNumpad();
  carregarObsOptions();
  setTimeout(() => {
    const numpadNum = JSON.parse(localStorage.getItem("numpadData"));
    numpadNum.forEach((item) => {
      if (item.corrida > 0) {
        document.getElementById("numberCorrida").value = Number(
          item.numberCorrida
        );
      } else {
        document.getElementById("numberCorrida").value = 1;
      }

      document.getElementById("numberCurvas").value = Number(
        item.numberButtons
      );
      document.getElementById("inputCorrida").value = Number(
        item.numberCorrida
      );
      localStorage.setItem("numCorridas", item.numberCorrida);
      localStorage.setItem("numCurvasBD", item.numberButtons);
      generateNumpad();
    });
    pesquisarCorrida(localStorage.getItem("corridaChoice"));
  }, 180);
});

//
document.addEventListener("DOMContentLoaded", function () {
  const pesquisaOptions = document.getElementById("pesquisaOptions");

  if (pesquisaOptions !== null) {
    pesquisaOptions.value = 1;
  } else {
    console.error("Elemento com ID 'pesquisaOptions' não encontrado.");
  }
});

// Chamar a função updateClock() para exibir a hora atual quando a página for carregada
window.addEventListener("load", updateClock);

// Chamar a função para rolar até o final da página quando a página for carregada
window.addEventListener("load", function () {
  scrollToBottomWithDelay();
});

//Muda o nome da corrida para a ultima da tabela
document.addEventListener("DOMContentLoaded", function () {
  updateHeaderWithLastRaceText();
});

// Verifica se a PWA já foi instalada
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
  // Previne o comportamento padrão do browser
  e.preventDefault();
  // Armazena o evento para ser usado mais tarde
  deferredPrompt = e;
  // Exibe um botão ou elemento na interface do usuário para solicitar a instalação
  showInstallPrompt();
});

//fazer logout
document.addEventListener("DOMContentLoaded", function () {
  try {
    const logoutButton = document.getElementById("logoutButton");

    logoutButton.addEventListener("click", function () {
      // Fazer solicitação para logout
      console.log("1");
      fetch("/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Inclua o token de autenticação no cabeçalho Authorization
          Authorization: `Bearer ${JSON.parse(localStorage.getItem("responseData") || "null")?.token}`,
        },
      })
        .then((response) => {
          if (response.ok) {
            // Se o logout for bem-sucedido, limpe o token armazenado no localStorage
            localStorage.removeItem("responseData");
            localStorage.removeItem("usertype");
            // Redirecionar de volta para a página index.html
            window.location.href = "index.html";
          } else {
            // Se o logout falhar, exiba uma mensagem de erro
            console.error("Failed to logout");
          }
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    });
  } catch (error) {
    console.error("Botao nao disponivel.");
  }
});

// test 15 second interval method

//--------------------------------------------------------FUNÇÕES-------------------------------------------------------------

//----------------------PAGINA----------------------
// Define a função para carregar os dados quando a página é carregada

function carregarDados() {
  // Definir o IP/URL para onde enviar os dados
  const url = "/getData";

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      // Atualiza a tabela com os dados recebidos
      atualizarTabela(data);
      // Armazena os dados localmente para uso posterior
      localStorage.setItem("dadosTabela", JSON.stringify(data));
    })
    .catch((error) => console.error("Erro ao obter dados:", error));
}

//Muda o nome da corrida e adiciona na BD
function inputRace() {
  // Verificar se o usuário é admin
  const userType = localStorage.getItem("usertype");
  console.log(userType);

  if (userType !== "admin") {
    alert("Você não tem permissão para alterar o nome da corrida.");
    return; // Impede que o restante do código seja executado
  }

  const rname = prompt("Qual é o nome da corrida?");
  if (rname != null) {
    document.getElementById("header").textContent = rname;
    // Enviar o nome da corrida para o backend
    fetch("/addRace", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ race: rname }), // Alterado de 'name' para 'race'
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro ao adicionar corrida");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Corrida adicionada com sucesso:", data);
      })
      .catch((error) => {
        console.error("Erro ao adicionar corrida:", error);
      });
  }
}

//Muda o nome da corrida para a ultima da tabela
function updateHeaderWithLastRaceText() {
  fetch("/getLRace")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erro ao obter o texto da última corrida");
      }
      return response.json();
    })
    .then((data) => {
      const headerElement = document.getElementById("header");
      const headerClienteElement = document.getElementById("headerCliente");
      if (headerElement) {
        headerElement.textContent = data.lastRaceText;
      } else if (headerClienteElement) {
        headerClienteElement.textContent = data.lastRaceText;
      }
    })
    .catch((error) => {
      console.error("Erro ao obter o texto da última corrida:", error);
    });
}

//Alerta de WIP
function showWorkInProgress() {
  alert("Esta funcionalidade está em desenvolvimento!");
}

//limpar LocalStorage
function limparLS() {
  localStorage.clear();
  console.log("localStorage foi limpo.");
}

//abre o popup
function abrirPopup() {
  document.getElementById("popup").style.display = "block";
  popupAberto = true;
}

//abre o popup2
function abrirPopup2() {
  document.getElementById("popup2").style.display = "block";
  popup2Aberto = true;
}

// Abre popup numpad
function abrirPopupNumpad() {
  document.getElementById("popupNumpad").style.display = "block";
  popupNumpadAberto = true;
}

// Abrir popup password
function abrirPopupNumpadPassword() {
  document.getElementById("numpad-password").style.display = "block";
  popupNumpadPasswordAberto = true;
}

// Fechar popup rodaDentada
function abrirPopupRodaDentada() {
  const rodaDentada = document.getElementById("popupRodadentada");
  document.getElementById("popupRodadentada").style.display = "block";
  const userType = localStorage.getItem("usertype");
  console.log(userType);
  if (userType != "admin") {
    document.getElementById("numberCurvas").classList.add("hidden");
    document.getElementById("numberCorrida").classList.add("hidden");
    document.getElementById("butaoSettings").classList.add("hidden");
    document.getElementById("botaoLimparTabela").classList.add("hidden");
    document.getElementById("butaoGerarNumpad").classList.add("hidden");
    document.getElementById("labelConfig").classList.add("hidden");
  }
  popupRodaDentada = true;
}

// Fechar popup rodaDentada
function abrirPopupConfiguracoes() {
  document.getElementById("popupConfiguracoes").style.display = "block";
  popupConfiguracoes = true;
}

// abrir popup para Observações adicionais
function abrirPopupAdicionaObservacoes() {
  document.getElementById("popupAdicionaObservações").style.display = "block";
  popupAdicionaObs = true;
}

// Fechar popup filtros
function abrirPopupFiltros() {
  document.getElementById("popupFiltros").style.display = "block";
  popupFiltros = true;
}

//fecha o popup
function fecharPopup() {
  document.getElementById("popup").style.display = "none";
  popupAberto = false;
  //location.reload();
}

//fecha o pupup2
function fecharPopup2() {
  document.getElementById("popup2").style.display = "none";
  resetPositionButtons();

  popup2Aberto = false;
  //location.reload();
}

// Fecha o popup Numpad
function fecharPopupNumpad() {
  document.getElementById("popupNumpad").style.display = "none";

  popupNumpadAberto = false;
}

// Fechar popup password
function fecharPopupNumpadPassword() {
  document.getElementById("numpad-password").style.display = "none";
  popupNumpadPasswordAberto = false;
}

// Fechar popup rodaDentada
function fecharPopupRodaDentada() {
  document.getElementById("popupRodadentada").style.display = "none";
  popupRodaDentada = false;
}

// Fechar popup Configuracoes
function fecharPopupConfiguracoes() {
  document.getElementById("popupConfiguracoes").style.display = "none";
  popupConfiguracoes = false;
}

// Fecha o popup para acrescentar Observações
function fecharPopupAdicionaObservacoes() {
  document.getElementById("popupAdicionaObservações").style.display = "none";

  popupAdicionaObs = false;
}

// Fechar popup Filtros
function fecharPopupFiltros() {
  document.getElementById("popupFiltros").style.display = "none";
  popupFiltros = false;
}

// Dar reset aos botoes de posição
function resetPositionButtons() {
  const popupEdit = document.getElementById("popupEdit");
  const botaoUp = document.getElementById("buttonUp");
  const botaoDown = document.getElementById("buttonDown");
  popupEdit.removeChild(botaoUp);
  popupEdit.removeChild(botaoDown);
}

// Adicionar tratamento de erros para requisições fetch
function refreshPage() {
  carregarDados(); // Chama a função para carregar os dados ao carregar a página
}

//função para atualizar a pagina
function getData() {
  // Verifica se os popups estão abertos
  if (
    popupAberto ||
    popup2Aberto ||
    campoPesquisa ||
    popupConfiguracoes ||
    popupFiltros
  ) {
    return Promise.resolve(null); // Retorna uma promessa resolvida com null se algum popup estiver aberto
  }

  const url = "/getData";

  return fetch(url)
    .then((response) => response.json())
    .catch((error) => {
      console.error("Erro ao obter dados:", error);
      return null;
    });
}

function atualizarPagina() {
  getData().then((data) => {
    if (data) {
      const dadosAntigos = localStorage.getItem("dadosTabela");
      const dadosNovos = JSON.stringify(data);

      // Verifica se há novos dados comparando com os dados armazenados localmente
      if (dadosNovos !== dadosAntigos) {
        // Atualiza os dados na Local Storage
        localStorage.setItem("dadosTabela", dadosNovos);
        // Recarrega a página
        location.reload();
      }
    }
  });
}

// Função para rolar até o final da página (última linha da tabela) com um pequeno atraso
/* function scrollToBottomWithDelay() {
  setTimeout(function () {
    var table = document.getElementById("tabela"); // ID da sua tabela
    if (table) {
      var lastRow = table.rows[table.rows.length - 1];
      if (lastRow) {
        lastRow.scrollIntoView();
      }
    }
  }, 100); // Ajuste o valor do atraso conforme necessário
} */

//atualiza o relogio
function updateClock() {
  var now = new Date();
  var hours = now.getHours().toString().padStart(2, "0");
  var minutes = now.getMinutes().toString().padStart(2, "0");
  var seconds = now.getSeconds().toString().padStart(2, "0");
  var timeString = hours + ":" + minutes + ":" + seconds;

  var clockElement = document.getElementById("clock");
  if (clockElement) {
    clockElement.textContent = timeString;
  }

  // Obter a data atual e formatá-la
  var options = { day: "numeric", month: "short", year: "numeric" };
  var dateString = now.toLocaleDateString("en-UK", options);

  // Exibir a data abaixo do relógio
  var dateElement = document.getElementById("date");
  if (dateElement) {
    dateElement.textContent = dateString;
  }
}

// Na página de cliente, troca a exibição da Tabela para o Numpad
function trocarParaNumpad() {
  const tabela = document.getElementById("tabela");
  const tabelaIcon = document.getElementById("iconTabela");
  const numpad = document.getElementById("numpad");
  const numpadIcon = document.getElementById("iconNumpad");
  const headerText = document.getElementById("currentOptionHeader");

  headerText.textContent = "List:";
  tabela.classList.add("hidden");
  tabelaIcon.classList.remove("hidden");
  numpad.classList.remove("hidden");
  numpadIcon.classList.add("hidden");
}

// Na página de cliente, troca a exibição do Numpad para a Tabela
function trocarParaTabela() {
  const tabela = document.getElementById("tabela");
  const tabelaIcon = document.getElementById("iconTabela");
  const numpad = document.getElementById("numpad");
  const numpadIcon = document.getElementById("iconNumpad");
  const headerText = document.getElementById("currentOptionHeader");

  headerText.textContent = "Numpad:";
  tabela.classList.remove("hidden");
  tabelaIcon.classList.add("hidden");
  numpad.classList.add("hidden");
  numpadIcon.classList.remove("hidden");
}

//install prompt do PWA
function showInstallPrompt() {
  // Exibe um botão ou elemento na interface do usuário para solicitar a instalação
  const installButton = document.getElementById("logo");
  installButton.addEventListener("click", () => {
    // Exibe o prompt de instalação
    deferredPrompt.prompt();
    // Aguarda o usuário interagir com o prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === "accepted") {
        console.log("Usuário aceitou a instalação da PWA");
      } else {
        console.log("Usuário recusou a instalação da PWA");
      }
      // Limpa o objeto deferredPrompt para que o prompt não seja mostrado novamente
      deferredPrompt = null;
    });
  });
}

//----------------------TABELA----------------------

// Adicionadar função para adicionar nova linha à tabela
function adicionarLinha() {
  const registos = JSON.parse(localStorage.getItem("dadosTabela"));
  const arrayCorridas = JSON.parse(localStorage.getItem("opcoesCorridas"));
  const arrayRFlag = JSON.parse(localStorage.getItem("dadosTabela"));
  const numpadDBData = JSON.parse(localStorage.getItem("numpadData"));
  let corrida = document.getElementById("inputCorrida").value;
  const userType = localStorage.getItem("usertype");
  // Ir buscar o numero da corrida
  if (userType == "user") {
    if (corrida == null || corrida == "") {
      numpadDBData.forEach((item) => {
        corrida = item.numberCorrida;
      });
    }
  } else {
    if (corrida == null || corrida == "") {
      numpadDBData.forEach((item) => {
        corrida = item.numberCorrida;
      });
    } else {
      if (corrida > 0) {
        updateNumpad(corrida);
      } else {
        updateNumpad(1);
      }
    }
  }
  if (corrida <= 0) {
    corrida = 1;
  }
  const tabela = document.querySelector("tbody");
  const novaLinha = document.createElement("tr");

  // Capturar os valores dos campos do pop-up
  const camera = document.getElementById("cameraNumber").value;
  let curva = document.getElementById("curvaInput").value;
  const hora = document.getElementById("horainput").value;
  const video = document.getElementById("videoCheck").checked;
  const report = document.getElementById("reportCheck").checked;
  const priority = document.getElementById("priorityCheck").checked;
  let obs = document.getElementById("obsInput").value;
  let obsDropDown = document.getElementById("obsInputSelect").value;

  if (obs != "" && obsDropDown != "") {
    obs = obs + " - " + obsDropDown;
  } else if (obs == "" && obsDropDown != "") {
    obs = obsDropDown;
  }

  // Adicionar a corrida ás obs se for start
  if (curva == "Start" && obs.includes("Race nº:") == false) {
    obs =
      `Race Nº:${corrida}\n` +
      document.getElementById("obsInput").value +
      document.getElementById("obsInputSelect2").value;
  }

  // Se report for 0, definir nfa como 1
  let nfa = false;
  if (!report) {
    nfa = null;
  }

  // Confirmar se a corrida já foi iniciada ou se está a ser iniciada em duplicado

  if (arrayRFlag && arrayRFlag.length > 0) {
    // Obter o último objeto do array (última linha de dados)
    const ultimaLinha = arrayRFlag[arrayRFlag.length - 1];
    console.log(ultimaLinha);

    // Verificar se a última linha está marcada como "Red Flag" e se a corrida está na lista de corridas
    if (
      ultimaLinha.curva === "Red Flag" &&
      arrayCorridas.includes(Number(corrida))
    ) {
      window.alert("Race Restarted");
      console.log("DD");
    } else {
      // Se a última linha não estiver marcada como "Red Flag", aplicar a condição
      if (curva === "Start" && arrayCorridas.includes(Number(corrida))) {
        window.alert("You can't start a race twice!");
        return;
      }
    }
  }

  // Armazenar os dados no localStorage
  const newData = {
    corrida: corrida,
    camera: camera,
    curva: curva,
    hora: hora,
    video: video,
    report: report,
    nfa: nfa,
    priority: priority,
    obs: obs,
  };

  // Convertendo para JSON e armazenando no localStorage
  localStorage.setItem("novaLinhaData", JSON.stringify(newData));
  enviarJson();
}

// Adicionar tabela cliente (para impedir que clientes possam alterar o numero da corrida na tabela)

//envio dados para servidor
function enviarJson() {
  // Recuperar os dados do localStorage
  const localStorageData = localStorage.getItem("novaLinhaData");
  console.log(localStorageData);

  // Definir o IP/URL para onde enviar os dados
  const url = "/addData";

  // Verificar se existem dados no localStorage
  if (localStorageData) {
    const parsedData = JSON.parse(localStorageData);
    // Enviar os dados para o servidor
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsedData),
    })
      .then((response) => response.json())
      .then(() => location.reload())
      .catch((error) =>
        console.error("Erro ao enviar dados para o servidor:", error)
      );
  } else {
    console.log("Nenhum dado encontrado no localStorage.");
  }
}

//Funçao para dar update á linha selecionada da tabela
function updateLinha() {
  // Captura os valores atualizados dos campos do pop-up
  let corrida = document.getElementById("inputCorrida2").value;
  const camera = document.getElementById("cameraNumber2").value;
  let curva = document.getElementById("curvaInput2").value;
  const hora = document.getElementById("horainput2").value;
  const video = document.getElementById("videoCheck2").checked;
  const report = document.getElementById("reportCheck2").checked;
  const priority = document.getElementById("priorityCheck2").checked;
  const nfa = document.getElementById("nfacheck2").checked;
  let obs = document.getElementById("obsInput2").value;
  let obsDropDown = document.getElementById("obsInputSelect2").value;

  // Caso tenham sido Post ou Turn anteriormente
  if (!curva.includes("P") && !curva.includes("Turn")) {
    if (detalheCurva == "P" || detalheCurva == "Turn") {
      curva += detalheCurva;
    }
  }
  // Corrida nunca pode ser 0
  if (corrida == 0) {
    corrida = 1;
  }
  if (curva == "Start") {
    if (obs.includes(`Race Nº:${detalheCorrida}`)) {
      obs = obs.replace(`Race Nº:${detalheCorrida}`, `Race Nº:${corrida}`);
    }
  } else {
    if (obs != "" && obsDropDown != "") {
      obs = obs + " - " + obsDropDown;
    } else if (obs == "" && obsDropDown != "") {
      obs = obsDropDown;
    }
  }

  // Cria um objeto com os dados atualizados
  const updatedData = {
    corrida: corrida,
    camera: camera,
    curva: curva,
    hora: hora,
    video: video,
    report: report,
    nfa: nfa,
    priority: priority,
    obs: obs,
  };

  // Recupera o ID dos detalhes armazenados no localStorage
  const detalhes = JSON.parse(localStorage.getItem("detalhesPopup"));
  if (detalhes && detalhes._id) {
    // Adiciona o ID aos dados atualizados
    updatedData._id = detalhes._id;
  } else {
    console.error(
      "Erro: ID não encontrado nos detalhes armazenados no localStorage."
    );
    return; // Encerra a função se o ID não estiver disponível
  }

  // Armazena os dados atualizados no localStorage
  localStorage.setItem("novaLinhaData", JSON.stringify(updatedData));

  // Oculta o formulário de edição
  document.getElementById("popup").style.display = "none";

  envUpJson();
}

//Envio dos dados actualizados para a BD
function envUpJson() {
  // Obtém os dados atualizados do localStorage
  const updatedDataString = localStorage.getItem("novaLinhaData");
  // Verifica se há dados no localStorage
  if (updatedDataString) {
    const updatedData = JSON.parse(updatedDataString);

    // Define o ID do documento a ser atualizado (obtido do localStorage)
    const id = updatedData._id;
    // Definir o IP/URL para onde enviar os dados
    const url = `/updateData/${id}`;
    // Envia os dados atualizados para o servidor
    fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(Object.fromEntries(Object.entries(updatedData).filter(([key]) => !["_id", "__v"].includes(key)))),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Dados atualizados com sucesso:", data);

        // Limpa os dados do localStorage após a atualização
        localStorage.removeItem("novaLinhaData");
        location.reload();
      })
      .catch((error) => {
        console.error(
          "Erro ao enviar dados atualizados para o servidor:",
          error
        );
      });
  } else {
    console.error("Nenhum dado encontrado no localStorage para enviar.");
  }
}

//Apaga a linha
function deleteLinha() {
  // Recupera o ID dos detalhes armazenados no localStorage
  const detalhes = JSON.parse(localStorage.getItem("detalhesPopup"));
  // Verifica se o ID está disponível nos detalhes
  if (detalhes && detalhes._id) {
    // Faz uma solicitação DELETE para excluir a linha com o ID especificado
    fetch(`/dropData/${detalhes._id}`, {
      method: "DELETE",
    })
      .then((response) => {
        if (response.ok) {
          console.log("Linha excluída com sucesso.");
          // Se a linha foi excluída com sucesso, você pode tomar alguma ação adicional aqui, como recarregar a página ou atualizar a tabela
        } else {
          console.error("Erro ao excluir linha:", response.status);
        }
      })
      .catch((error) => {
        console.error("Erro ao excluir linha:", error);
      });
  } else {
    console.error(
      "Erro: ID não encontrado nos detalhes armazenados no localStorage."
    );
  }
}

// Atualiza a tabela com os dados recebidos
function atualizarTabela(data) {
  const tabela = document.getElementById("tabela");

  // Limpa apenas as linhas de dados da tabela, mantendo o cabeçalho
  while (tabela.rows.length > 1) {
    tabela.deleteRow(1);
  }

  // Adiciona linhas à tabela com os dados recebidos
  var counter = 1;
  data.forEach((item) => {
    const novaLinha = document.createElement("tr");

    // Id

    const IdCell = document.createElement("td");
    IdCell.classList.add("hidden");
    IdCell.contenteditable = false;
    IdCell.textContent = `${item._id}`;

    // Camera

    const CameraCell = document.createElement("td");
    CameraCell.contenteditable = false;
    CameraCell.textContent = `${item.camera}`;

    // Curva

    const CurvaCell = document.createElement("td");
    CurvaCell.contenteditable = false;
    CurvaCell.textContent = `${item.curva}`;

    // Hora

    const HoraCell = document.createElement("td");
    HoraCell.contenteditable = false;
    HoraCell.textContent = `${item.hora}`;

    //Checkboxes

    //Video
    const VideoCell = document.createElement("td");
    VideoCell.contenteditable = "False";
    const VideosCheck = document.createElement("input");
    VideosCheck.type = "checkbox";
    VideosCheck.contenteditable = "False";
    if (item.video == true) {
      VideosCheck.checked = true; // unceirtain
    } else {
      VideosCheck.checked = false; // unceirtain
    }
    VideosCheck.disabled = true;
    VideoCell.appendChild(VideosCheck);

    // Report

    const ReportCell = document.createElement("td");
    ReportCell.contenteditable = "False";
    const ReportCheck = document.createElement("input");
    ReportCheck.type = "checkbox";
    ReportCheck.contenteditable = false;
    if (item.report == true) {
      ReportCheck.checked = true; // unceirtain
    } else {
      ReportCheck.checked = false; // unceirtain
    }
    ReportCheck.disabled = true;
    ReportCell.appendChild(ReportCheck);

    // NFA

    const NFACell = document.createElement("td");
    NFACell.contenteditable = false;
    const NFACheck = document.createElement("input");
    NFACheck.type = "checkbox";
    NFACheck.contenteditable = false;
    if (item.nfa == true) {
      NFACheck.checked = true; // unceirtain
    } else {
      NFACheck.checked = false; // unceirtain
    }
    NFACheck.disabled = true;
    NFACell.appendChild(NFACheck);

    // Obs

    const ObsCell = document.createElement("td");
    ObsCell.contenteditable = false;
    ObsCell.textContent = `${item.obs}`;

    // Editar

    const EditarCell = document.createElement("td");
    EditarCell.id = "tdlg";
    const ImageEditCell = document.createElement("img");
    ImageEditCell.id = "editlg";
    ImageEditCell.src = "images/pen.png";
    ImageEditCell.alt = "Editar";

    ImageEditCell.onclick = function () {
      abrirDetalhes(`${item._id}`);
    };

    EditarCell.appendChild(ImageEditCell);

    // Cell for both buttons

    // Up

    const ButtonsCell = document.createElement("td");
    ButtonsCell.id = "positionButton";
    ButtonsCell.classList.add("hidden");
    const ButtonUp = document.createElement("button");
    ButtonUp.classList.add("buttaoUpDown");
    ButtonUp.id = `buttonUp${item._id}`;
    ButtonUp.onclick = function () {
      moveUp(this);
    };
    ButtonUp.textContent = "↑";

    //Down

    const ButtonDown = document.createElement("button");
    ButtonDown.classList.add("buttaoUpDown");
    ButtonDown.id = `buttonDown${item._id}`;
    ButtonDown.onclick = function () {
      moveDown(this);
    };
    ButtonDown.textContent = "↓";

    ButtonsCell.appendChild(ButtonUp);
    ButtonsCell.appendChild(ButtonDown);

    const CorridaCell = document.createElement("td");
    CorridaCell.classList.add("hidden");
    CorridaCell.contenteditable = false;
    CorridaCell.textContent = `${item.corrida}`;

    novaLinha.appendChild(IdCell);
    novaLinha.appendChild(CameraCell);
    novaLinha.appendChild(CurvaCell);
    novaLinha.appendChild(HoraCell);
    novaLinha.appendChild(VideoCell);
    novaLinha.appendChild(ReportCell);
    novaLinha.appendChild(NFACell);
    novaLinha.appendChild(ObsCell);
    novaLinha.appendChild(EditarCell);
    novaLinha.appendChild(ButtonsCell);
    novaLinha.appendChild(CorridaCell);

    // Adiciona classes CSS com base nos valores de report e nfa
    if (item.report) {
      novaLinha.classList.add("report-true");
    }
    if (item.nfa) {
      novaLinha.classList.add("nfa-true");
    }
    if (item.priority) {
      novaLinha.classList.add("priority-set");
    }
    if (item.curva == "Start") {
      novaLinha.classList.add("post-start");
    }
    if (item.curva == "Slow Flag") {
      novaLinha.classList.add("post-slow");
    }
    if (item.curva == "Red Flag") {
      novaLinha.classList.add("post-redflag");
    }

    counter++;
    tabela.appendChild(novaLinha);
  });

  analisarCorridas(); //Analisar nº corridas no fim
}

// Adicionada a função para limpar a tabela
function limparTabela() {
  // Mensagem de confirmação
  if (!confirm("Tem certeza de que deseja apagar a tabela?")) {
    location.reload();
    return; // Se o usuário cancelar, sair da função
  }

  // Definir o IP/URL para onde enviar os dados
  const url = "/dropData";

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      location.reload();
      console.log(data.message);
      fecharPopupRodaDentada(); // Mensagem retornada pelo servidor
    })
    .catch((error) => {
      console.error("Erro ao apagar dados:", error);
    });
}

//----------------------NUMPAD----------------------

// Ir buscar dados numpad a database
function carregarDadosNumpad() {
  // Faz uma requisição GET para obter os dados do servidor quando a página é carregada

  // Definir o IP/URL para onde enviar os dados
  const endpoint = "getDataNumpad";
  const furl = url + endpoint;

  return fetch(furl)
    .then((response) => response.json())
    .then((data) => {
      // Atualiza a tabela com os dados recebidos
      // Armazena os dados localmente para uso posterior
      localStorage.setItem("numpadData", JSON.stringify(data));
      const databaseNum = JSON.parse(localStorage.getItem("numpadData"));
      console.log(databaseNum);
      if (databaseNum) {
        databaseNum.forEach((item) => {
          if (item.numberButtons != null || item.numberButtons != undefined) {
            document.getElementById("numberCurvas").value = item.numberButtons;
          }
        });
      } else {
        document.getElementById("numberCurvas").value =
          localStorage.getItem("numCurves");
      }
    })
    .catch((error) => console.error("Erro ao obter dados:", error));

  //Preencher com os dados do numpad onload
}

// Adicionar numero ao numpad
function adicionarNumpadNum() {
  const numpadNumber = document.getElementById("numberCurvas").value;
  let corridaNumber;
  // Se tiver recebido alteração por um input na corrida(popup de criação)
  corridaNumber = document.getElementById("numberCorrida").value;

  const newNum = {
    numberButtons: numpadNumber,
    numberCorrida: corridaNumber,
  };
  localStorage.setItem("novoNumpadNum", JSON.stringify(newNum));
  const existing = JSON.parse(localStorage.getItem('numpadData') || '[]')[0];
  return fetch(existing ? '/updateNumpad/' + existing._id : '/addDataNumpad', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newNum)
  }).then(() => carregarDadosNumpad());
}

//Envia o num de numpad á BD
function enviarJsonNumpad() {
  // Recuperar os dados do localStorage
  const localStorageData = localStorage.getItem("novoNumpadNum");

  // Definir o IP/URL para onde enviar os dados
  const url = "/addDataNumpad";

  // Verificar se existem dados no localStorage
  if (localStorageData) {
    const parsedData = JSON.parse(localStorageData);
    // Enviar os dados para o servidor
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsedData),
    })
      .then((response) => response.json())
      .then((data) => console.log(data))
      .catch((error) =>
        console.error("Erro ao enviar dados para o servidor:", error)
      );
  } else {
    console.log("Nenhum dado encontrado no localStorage.");
  }
}

function updateNumpad(corrida) {
  // Captura os valores atualizados dos campos do pop-up
  const numpadNumber = document.getElementById("numberCurvas").value;
  let corridaNumber;
  if (corrida <= 0) {
    corridaNumber = 1;
  } else {
    corridaNumber = corrida;
  }

  // Se tiver recebido alteração por um input na corrida(popup de criação)

  const updatedNumpadData = {
    numberButtons: numpadNumber,
    numberCorrida: corridaNumber,
  };

  // Recupera o ID dos detalhes armazenados no localStorage
  const detalhesNumpad = JSON.parse(localStorage.getItem("numpadData"));
  console.log(detalhesNumpad.id);
  detalhesNumpad.forEach((item) => {
    updatedNumpadData._id = item._id;
  });
  // Armazena os dados atualizados no localStorage
  localStorage.setItem("updatedNumpadData", JSON.stringify(updatedNumpadData));

  envUpNumpadJson();
}

function envUpNumpadJson() {
  // Obtém os dados atualizados do localStorage
  const updatedDataString = localStorage.getItem("updatedNumpadData");
  // Verifica se há dados no localStorage
  if (updatedDataString) {
    const updatedData = JSON.parse(updatedDataString);

    // Define o ID do documento a ser atualizado (obtido do localStorage)
    const id = updatedData._id;
    // Definir o IP/URL para onde enviar os dados
    const url = `/updateNumpad/${id}`;
    // Envia os dados atualizados para o servidor
    console.log(updatedData);
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(Object.fromEntries(Object.entries(updatedData).filter(([key]) => !["_id", "__v"].includes(key)))),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Dados atualizados com sucesso:", data);

        // Limpa os dados do localStorage após a atualização
        localStorage.removeItem("updatedNumpadData");
      })
      .catch((error) => {
        console.error(
          "Erro ao enviar dados atualizados para o servidor:",
          error
        );
      });
  } else {
    console.error("Nenhum dado encontrado no localStorage para enviar.");
  }
}

// Dar reset ao numero de numpad
function eliminarNumpadNum() {
  // Definir o IP/URL para onde enviar os dados
  const url = "/dropDataNumpad";

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      //location.reload;
      console.log(data.message); // Mensagem retornada pelo servidor
    })
    .catch((error) => {
      console.error("Erro ao apagar dados:", error);
    });
}

// Preencher informação com a curva quando utilizar Numpad
function obterCurvaNum(curva) {
  document.getElementById("curvaInput").value = document.getElementById(
    `curva${curva}`
  ).value;
}

// Gera o numpad na página baseado no numero armazenado na localStorage(este é alcançado pelo valor na database)
function generateNumpad() {
  //Se já existir um numpad gerado, não acrescenta mais um
  // Gerar Número de curvas no numpad
  let generatedNumber;
  if (document.getElementById("numpad-table") == null) {
    const num = document.getElementById("numberCurvas").value;
    const databaseNum = Number(localStorage.getItem("numCurvasBD"));
    if (databaseNum) {
      generatedNumber = databaseNum;
    } else {
      generatedNumber = num;
    }
    const numpadDiv = document.getElementById("numpad");
    const numpadTable = document.createElement("table");
    numpadTable.id = "numpad-table";
    let numpadRow = document.createElement("tr");
    numpadRow.classList.add("numpad-row");
    numpadTable.appendChild(numpadRow);
    numpadDiv.appendChild(numpadTable);
    // De acordo com o numero recebido gera 2 buttoes por linha
    for (let i = 1; i <= generatedNumber; i++) {
      const numpadCell = document.createElement("td");
      numpadCell.classList.add("numpad-cell");
      const numpadButton = document.createElement("button");
      numpadButton.classList.add("numpad-Button");
      numpadButton.textContent = i;
      numpadButton.id = `curva${i}`;
      numpadButton.onclick = function () {
        abrirPopupNumpad();
        abrirPopup();
        obterHoraAtual();
        obterCurvaNum(i);
      };
      numpadButton.value = i;
      numpadCell.appendChild(numpadButton);
      numpadRow.appendChild(numpadCell);
      //A cada 2 celulas, fecha e abro uma linha nova
      if (i % 2 == 0 && i != num) {
        numpadRow = document.createElement("tr");
        numpadRow.classList.add("numpad-row");
        numpadTable.appendChild(numpadRow);
      }
    }

    //Guardar ultimo numero de curvas guardado
    if (generatedNumber != num) {
      localStorage.setItem("numCurves", generatedNumber);
    } else {
      localStorage.setItem("numCurves", num);
    }
  } else {
    //Caso já exista uma, remover e adicionar novo input
    const num = document.getElementById("numberCurvas").value;
    const databaseNum = localStorage.getItem("numCurvasBD");
    console.log(databaseNum);
    if (databaseNum != undefined || databaseNum != null) {
      generatedNumber = databaseNum;
    } else {
      generatedNumber = num;
    }
    const numpadTable = document.getElementById("numpad-table");
    numpadTable.innerHTML = "";
    let numpadRow = document.createElement("tr");
    numpadRow.classList.add("numpad-row");
    numpadTable.appendChild(numpadRow);
    // De acordo com o numero recebido gera 2 buttoes por linha
    for (let i = 1; i <= generatedNumber; i++) {
      const numpadCell = document.createElement("td");
      numpadCell.classList.add("numpad-cell");
      const numpadButton = document.createElement("button");
      numpadButton.classList.add("numpad-Button");
      numpadButton.textContent = i;
      numpadButton.id = `curva${i}`;
      numpadButton.onclick = function () {
        abrirPopupNumpad();
        abrirPopup();
        obterHoraAtual();
        obterCurvaNum(i);
      };
      numpadButton.value = i;
      numpadCell.appendChild(numpadButton);
      numpadRow.appendChild(numpadCell);
      //A cada 2 celulas, fecha e abro uma linha nova
      if (i % 2 == 0 && i != num) {
        numpadRow = document.createElement("tr");
        numpadRow.classList.add("numpad-row");
        numpadTable.appendChild(numpadRow);
      }
    }
    if (generatedNumber != num) {
      localStorage.setItem("numCurves", generatedNumber);
    } else {
      localStorage.setItem("numCurves", num);
    }
  }
}

//----------------------PESQUISA----------------------

//----------------------------------------------------------------------------vPROTOTYPO PESQUISAR COM CORRIDA SELECTEDv--------------------------------------------
/* function atualizarTabelaPesquisa(data, numCorrida){
  const tabela = document.getElementById("tabela");
  const tabelaPesquisa = document.getElementById("tabelaCorrida");
 
   // Limpa apenas as linhas de dados da tabela, mantendo o cabeçalho
   while (tabelaPesquisa.rows.length > 1) {
     tabelaPesquisa.deleteRow(1);
   }
 
   // Adiciona linhas à tabela com os dados recebidos
   var counter = 1;
 if(numCorrida){
    tabela.classList.add("hidden")
    tabelaPesquisa.classList.remove("hidden")
   data.forEach((item) => {
     if(item.corrida==numCorrida){
 
     const novaLinha = document.createElement("tr");
     novaLinha.innerHTML = `
       <td class="hidden">${item._id}</td>
       <td contenteditable="false">${item.camera}</td>
       <td contenteditable="false">${item.curva}</td>
       <td contenteditable="false">${item.hora}</td>
       <td contenteditable="false"><input type="checkbox" ${
         item.video ? "checked" : ""
       } disabled></td>
       <td contenteditable="false"><input type="checkbox" ${
         item.report ? "checked" : ""
       } disabled></td>
       <td contenteditable="false"><input type="checkbox" ${
         item.nfa ? "checked" : ""
       } disabled></td>
       <td contenteditable="false">${item.obs}</td>
       <td id="tdlg"><img src="images/pen.png" alt="Editar" id="editlg" onclick="abrirDetalhes('${
         item._id
       }')"></td>
       <td id="positionButton" class="hidden"><button class="buttaoUpDown" id="buttonUp${
         item._id
       }" onclick="moveUp(this)">↑</button><button class="buttaoUpDown"  id="buttonDown${
       item._id
     }" onclick="moveDown(this)">↓</button>
      <td class="hidden">${item.corrida}</td>
       `;
 
     // Adiciona classes CSS com base nos valores de report e nfa
     if (item.report) {
       novaLinha.classList.add("report-true");
     }
     if (item.nfa) {
       novaLinha.classList.add("nfa-true");
     }
     if (item.priority) {
       novaLinha.classList.add("priority-set");
     }
     if (item.curva == "Start") {
       novaLinha.classList.add("post-start");
     }
     if (item.curva == "Slow Flag") {
       novaLinha.classList.add("post-slow");
     }
     if (item.curva == "Red Flag") {
       novaLinha.classList.add("post-redflag");
     }
     }
     counter++;
     tabelaPesquisa.appendChild(novaLinha);
   });
 }else{
    tabela.classList.remove("hidden")
    tabelaPesquisa.classList.add("hidden")
 }
 
 }
 */

//----------------------------------------------------------------------------^PROTOTYPO PESQUISAR COM CORRIDA SELECTED ^-------------------------------------------

//Quando a página acaba de carregar verifica o indice máximo corrente

//Função que muda a pesquisa quando o usuário seleciona uma opção no menu de filtros (Lupa)
function mudaPesquisa() {
  let pesquisaChoice = document.getElementById("pesquisaOptions");
  const historyChoice = localStorage.getItem("pesquisaChoice");
  const pesquisa = document.getElementById("pesquisa");
  const searchFiltro = document.getElementById("searchFiltro");

  pesquisaChoice.addEventListener("change", function () {
    const selectedOption =
      pesquisaChoice.options[pesquisaChoice.selectedIndex].text;
    searchFiltro.textContent = selectedOption;
    localStorage.setItem("labelPesquisa", selectedOption);
    localStorage.setItem("pesquisaChoice", pesquisaChoice.value);

    if (pesquisaChoice.value == 1) {
      pesquisa.onkeyup = function () {
        pesquisarTabelaPost();
      };
    } else if (pesquisaChoice.value == 2) {
      pesquisa.onkeyup = function () {
        pesquisarTabelaHour();
      };
    } else if (pesquisaChoice.value == 3) {
      pesquisa.onkeyup = function () {
        pesquisarTabelaObs();
      };
    }
  });
}

// Carregar a pesquisa selecionada anteriormente
function loadPesquisaChoice() {
  let pesquisaChoice = document.getElementById("pesquisaOptions");
  const choice = localStorage.getItem("pesquisaChoice");
  const pesquisa = document.getElementById("pesquisa");
  const searchFiltro = document.getElementById("searchFiltro");
  searchFiltro.textContent = localStorage.getItem("labelPesquisa");

  if (choice != null) {
    pesquisaChoice.value = choice;
    if (pesquisaChoice.value == 1) {
      pesquisa.onkeyup = function () {
        pesquisarTabelaPost();
      };
    } else if (pesquisaChoice.value == 2) {
      pesquisa.onkeyup = function () {
        pesquisarTabelaHour();
      };
    } else if (pesquisaChoice.value == 3) {
      pesquisa.onkeyup = function () {
        pesquisarTabelaObs();
      };
    }
  }
}

/* Adiciona função filtragem*/
function pesquisarTabelaObs() {
  // Declare variables
  var input, filter, table, tr, td, i, txtValue;
  input = document.getElementById("pesquisa");
  filter = input.value.toUpperCase();
  table = document.getElementById("tabela");
  tr = table.getElementsByTagName("tr");

  // Loop para percorrer cada linha da tabela, e verificar o conteudo na celula de index especificado(td e o indice é a coluna)
  for (i = 0; i < tr.length; i++) {
    td = tr[i].getElementsByTagName("td")[7]; //Escolha de qual a coluna onde a pesquisa vai incidir 5->Observações
    if (td) {
      txtValue = td.textContent || td.innerText;
      if (txtValue.toUpperCase().indexOf(filter) > -1) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    }
  }
}

// Pesquisar pela Hora
function pesquisarTabelaHour() {
  // Declare variables
  var input, filter, table, tr, td, i, txtValue;
  input = document.getElementById("pesquisa");
  filter = input.value.toUpperCase();
  table = document.getElementById("tabela");
  tr = table.getElementsByTagName("tr");

  // Loop para percorrer cada linha da tabela, e verificar o conteudo na celula de index especificado(td e o indice é a coluna)
  for (i = 0; i < tr.length; i++) {
    td = tr[i].getElementsByTagName("td")[3]; //Escolha de qual a coluna onde a pesquisa vai incidir 1->Hour
    if (td) {
      txtValue = td.textContent || td.innerText;
      if (txtValue.toUpperCase().indexOf(filter) > -1) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    }
  }
}

// Seleção da corrida no menu de filtros(Por enquanto se o usuário escrever na barra de pesquisa, esta função leva overwrite e são exibidos todos os registo de acordo com a pesquisa)
function pesquisarCorrida(corridaLastChoice) {
  var input, filter, table, tr, td, i, txtValue;
  const searchCorrida = document.getElementById("searchCorrida");

  if (corridaLastChoice) {
    //se receber um parametro com um valor
    input = corridaLastChoice;
    filter = input;
    if (corridaLastChoice != "") {
      searchCorrida.textContent = ` | Race Nº ${corridaLastChoice}`;
    } else {
      searchCorrida.textContent = ` | All Races`;
    }
  } else {
    input = document.getElementById("pesquisaCorrida");
    localStorage.setItem("corridaChoice", input.value);
    filter = input.value.toUpperCase();
    if (filter != "") {
      searchCorrida.textContent = ` | Race Nº ${localStorage.getItem(
        "corridaChoice"
      )}`;
    } else {
      searchCorrida.textContent = ` | All Races`;
    }
  }
  table = document.getElementById("tabela");
  tr = table.getElementsByTagName("tr");
  console.log(filter);
  // Loop para percorrer cada linha da tabela, e nessa linha verificar o conteudo de uma celula(td) de uma coluna especifica
  for (i = 0; i < tr.length; i++) {
    td = tr[i].getElementsByTagName("td")[10]; //Escolha de qual a coluna onde a pesquisa vai incidir 1->Hour
    if (td) {
      // Se essa coluna existir
      txtValue = td.textContent || td.innerText; // Obter o seu conteudo
      if (filter == "") {
        // Verificar se está vazio (ou seja mostrar todas as corridas)
        tr[i].style.display = "";
      } else if (txtValue.trim() === filter) {
        //  Se se verificar o valor exato mostra, senão esconde
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    }
  }
}

// Pesquisar na tabela pelo campo Turn/Post
function pesquisarTabelaPost() {
  // Declare variables
  var input, filter, table, tr, td, i, txtValue;
  input = document.getElementById("pesquisa");
  filter = input.value.toUpperCase();
  table = document.getElementById("tabela");
  tr = table.getElementsByTagName("tr");

  // Loop para percorrer cada linha da tabela, e verificar o conteudo na celula de index especificado(td e o indice é a coluna)
  for (i = 0; i < tr.length; i++) {
    td = tr[i].getElementsByTagName("td")[2]; //Escolha de qual a coluna onde a pesquisa vai incidir 0->Post
    if (td) {
      txtValue = td.textContent || td.innerText;
      if (txtValue.toUpperCase().indexOf(filter) > -1) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    }
  }
}

//----------------------POPUPs----------------------

// Adicionada a função para atualizar o estado do checkbox no localStorage
function atualizarEstadoCheckbox(checkbox) {
  const estadoAtual = checkbox.dataset.estado;
  checkbox.dataset.estado = estadoAtual === "0" ? "1" : "0";
  localStorage.setItem(
    `checkbox_${checkbox.parentElement.parentElement.rowIndex}`,
    checkbox.dataset.estado
  );
}

// Função para abrir o pop-up com os detalhes da linha correspondente
function abrirDetalhes(id) {
  const data = JSON.parse(localStorage.getItem("dadosTabela")); // Obtemos os dados da localStorage
  const detalhes = data.find((item) => item._id === id); // Encontramos o item com o id correspondente
  if (detalhes) {
    // Se encontrarmos os detalhes, preenchemos o pop-up e o exibimos
    if (popup2Aberto == true) {
      resetPositionButtons();
    }

    preencherPopupComDetalhes(detalhes);
    generatePositionButtons(detalhes);
    abrirPopup2();
  } else {
    console.error("Detalhes não encontrados para o ID:", id);
  }
}
//preenche o popup com os detalhes da linha
function preencherPopupComDetalhes(detalhes) {
  // Armazena os detalhes no localStorage
  localStorage.setItem("detalhesPopup", JSON.stringify(detalhes));

  // Verifica se os detalhes são válidos
  if (detalhes) {
    // Obtém os elementos do popup
    const cameraInput = document.getElementById("cameraNumber2");
    const curvaInput = document.getElementById("curvaInput2");
    const horainput = document.getElementById("horainput2");
    const videoCheck = document.getElementById("videoCheck2");
    const reportCheck = document.getElementById("reportCheck2");
    const priorityCheck = document.getElementById("priorityCheck2");
    const obsInput = document.getElementById("obsInput2");
    const nfaCheck = document.getElementById("nfacheck2");
    const corridaInput = document.getElementById("inputCorrida2");

    // Verifica se os elementos existem no DOM
    if (
      curvaInput &&
      horainput &&
      videoCheck &&
      reportCheck &&
      nfaCheck &&
      obsInput &&
      cameraInput &&
      priorityCheck &&
      corridaInput
    ) {
      // Atribui os valores dos detalhes aos campos do popup
      corridaInput.value = detalhes.corrida || "";
      cameraInput.value = detalhes.camera || "";
      curvaInput.value = detalhes.curva || "";
      horainput.value = detalhes.hora || "";
      videoCheck.checked = detalhes.video || false;
      nfaCheck.checked = detalhes.nfa || false;
      reportCheck.checked = detalhes.report || false;
      priorityCheck.checked = detalhes.priority || false;
      obsInput.value = detalhes.obs || "";

      //Guardar o input da curva anterior Turn ou Post
      if (curvaInput.value.includes("P")) {
        detalheCurva = "P";
      } else if (curvaInput.value.includes("Turn")) {
        detalheCurva = "Turn";
      }

      //Para poder retirar e substituir nas obs quando mudam a corrida
      detalheCorrida = detalhes.corrida;
    } else {
      console.error(
        "Um ou mais elementos do popup não foram encontrados no DOM."
      );
    }
  } else {
    console.error("Detalhes inválidos.");
  }
}
// Função para criar os botões de troca de posição da linha selecionada
function generatePositionButtons(detalhes) {
  const popupEdit = document.getElementById("popupEdit");
  const originalUp = document.getElementById(`buttonUp${detalhes._id}`);
  const originalDown = document.getElementById(`buttonDown${detalhes._id}`);
  const buttonUp = document.createElement("button");
  buttonUp.classList.add("buttaoUpDown");
  buttonUp.textContent = "↑";
  buttonUp.id = `buttonUp`;
  buttonUp.addEventListener("click", () => {
    originalUp.click();
  });

  const buttonDown = document.createElement("button");
  buttonDown.classList.add("buttaoUpDown");
  buttonDown.textContent = "↓";
  buttonDown.id = `buttonDown`;
  buttonDown.addEventListener("click", () => {
    originalDown.click();
  });

  popupEdit.appendChild(buttonUp);
  popupEdit.appendChild(buttonDown);
}
// Adicionadar o evento de editar a hora
function editarHora() {
  const celulaHora = event.target;
  celulaHora.setAttribute("contenteditable", "true");
  celulaHora.style.color = "#";
  celulaHora.classList.remove("hora-editavel");
}

// Adicionar a função para obter a hora atual formatada
function obterHoraAtual() {
  const agora = new Date();
  const horas = agora.getHours().toString().padStart(2, "0");
  const minutos = agora.getMinutes().toString().padStart(2, "0");
  const segundos = agora.getSeconds().toString().padStart(2, "0");
  const hour = `${horas}:${minutos}:${segundos}`;
  document.getElementById("horainput").value = hour;
}

//Red Flag e Start
function obterStartOrRF(valor) {
  document.getElementById("curvaInput").value = document.getElementById(
    `race${valor}`
  ).value;
}

//Adicionar Camera ou Post no field Curva/Post
function adicionarCameraOrPost(opcao) {
  if (opcao != "Camera") {
    document.getElementById("cameraNumber").value = "";
    document.getElementById("curvaInput").value += document.getElementById(
      `opcao${opcao}`
    ).value;
  } else {
    document.getElementById("cameraNumber").value =
      document.getElementById("curvaInput").value;
    document.getElementById("curvaInput").value = "";
  }
}

//Verificar password dar input de curvas
function checkPassword() {
  // Configuration permissions are enforced by the API; no shared password in the browser.
  if (!['admin', 'operator'].includes(localStorage.getItem('usertype'))) {
    window.alert('Sem permissao para alterar a configuracao.');
    return;
  }
  adicionarNumpadNum().then(() => {
    const settings = JSON.parse(localStorage.getItem('numpadData') || '[]')[0];
    if (settings) {
      localStorage.setItem('numCurvasBD', settings.numberButtons);
      localStorage.setItem('numCorridas', settings.numberCorrida);
    }
    generateNumpad();
    fecharPopupNumpadPassword();
    fecharPopupRodaDentada();
  }).catch(error => console.error('Unable to save configuration:', error));
}

// Função para determinar qual ação executar com base no popup aberto
function handleEnterKey(e) {
  if (e.key === "Enter") {
    // Verifica se o popup regular está aberto
    if (popupAberto) {
      adicionarLinha();
      fecharPopup();
    }
    // Verifica se o popup2 está aberto
    else if (popup2Aberto) {
      updateLinha();
      fecharPopup2();
    } else if (popupNumpadPasswordAberto) {
      checkPassword();
    }
    // Adicione mais verificações para outros popups, se necessário
    else {
      console.error("Erro: Nenhum popup aberto.");
    }
  }
}

// Adicione um ouvinte de evento de teclado ao documento
document.addEventListener("keydown", handleEnterKey);

// Mover a linha para cima
function moveUp(button) { return moveIncident(button, -1); }
function moveDown(button) { return moveIncident(button, 1); }
async function moveIncident(button, direction) {
  const row = button.closest('tr');
  const rows = Array.from(row.parentNode.rows);
  const adjacent = rows[rows.indexOf(row) + direction];
  if (!adjacent) return;
  try {
    await fetch('/reorderData', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: row.cells[0].textContent, adjacentId: adjacent.cells[0].textContent }) });
    location.reload();
  } catch (error) { console.error('Unable to reorder:', error); }
}

//Função que vai buscar o numero de corridas á localStorage(após a análise de todas as corridas de numero diferente na tabela)
function carregarOpcoesCorrida() {
  analisarCorridas();
  const selectCorrida = document.getElementById("pesquisaCorrida");
  const numCorridas = JSON.parse(localStorage.getItem("opcoesCorridas"));
  const maxCorridas = Math.max(...numCorridas);
  console.log(maxCorridas);
  if (!popupFiltros) {
    for (let i = 1; i <= maxCorridas; i++) {
      if (numCorridas.includes(i)) {
        const option = document.createElement("option");
        option.value = i;
        option.id = `corrida${i}`;
        option.textContent = `Race nº ${i}`;
        selectCorrida.appendChild(option);
      }
    }
  }
}

// Analisa todos os numeros diferentes de corridas na coluna de corridas
function analisarCorridas() {
  var table, tr, td, i, txtValue, setNumCorridas;
  setNumCorridas = new Set();
  table = document.getElementById("tabela");
  tr = table.getElementsByTagName("tr");
  // Loop para percorrer cada linha da tabela, e verificar o conteudo na celula de index especificado(td e o indice é a coluna)
  for (i = 0; i < tr.length; i++) {
    td = tr[i].getElementsByTagName("td")[10]; // access the 10th column
    if (td) {
      txtValue = td.textContent || td.innerText;
      if (i !== 0) {
        setNumCorridas.add(Number(txtValue));
      }
    }
  }
  console.log(Array.from(setNumCorridas));
  localStorage.setItem(
    "opcoesCorridas",
    JSON.stringify(Array.from(setNumCorridas))
  );
}

// Impedir que a lista seja replicada caso o usuario feixe a janela e abra outra vez(dá clear da lista aquando do fecho da janela)
function resetCorridas() {
  const selectCorrida = document.getElementById("pesquisaCorrida");
  selectCorrida.innerHTML = '<option value="">Race</option>';
}

// Carregar opções para Obs
function carregarObsOptions() {
  // Definir o IP/URL para onde enviar os dados
  const url = "/getObsOptions";

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      // Atualiza a tabela com os dados recebidos
      atualizarObsOptions(data);
      // Armazena os dados localmente para uso posterior
      localStorage.setItem("obsOptions", JSON.stringify(data));
    })
    .catch((error) => console.error("Erro ao obter dados:", error));
}

// Adicionar Acontecimentos as observacoes
function adicionarObsOptions() {
  const descricao = document.getElementById("newObs").value;

  const newData = {
    descricao: descricao,
  };

  localStorage.setItem("newOption", JSON.stringify(newData));
  enviarObsOptionJson();
}

function enviarObsOptionJson() {
  const localStorageData = localStorage.getItem("newOption");
  console.log(localStorageData);

  // Definir o IP/URL para onde enviar os dados
  const url = "/addObsOptions";

  // Verificar se existem dados no localStorage
  if (localStorageData) {
    const parsedData = JSON.parse(localStorageData);
    // Enviar os dados para o servidor
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsedData),
    })
      .then((response) => response.json())
      .then((data) => console.log(data))
      .catch((error) =>
        console.error("Erro ao enviar dados para o servidor:", error)
      );
  } else {
    console.log("Nenhum dado encontrado no localStorage.");
  }
}

// Ir buscar acontecimentos para observações
function atualizarObsOptions(data) {
  const selectObs = document.getElementById("obsInputSelect");
  const selectOBSUpdate = document.getElementById("obsInputSelect2");
  const obsOptions = JSON.parse(localStorage.getItem("obsOptions"));

  data.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.descricao;
    option.textContent = item.descricao;
    selectObs.appendChild(option);
  });

  data.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.descricao;
    option.textContent = item.descricao;
    selectOBSUpdate.appendChild(option);
  });
}



