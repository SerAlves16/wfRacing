if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker
      .register("/pwa/service-worker.js")
      .then(function (registration) {
        console.log(
          "ServiceWorker registration successful with scope: ",
          registration.scope
        );
      })
      .catch(function (err) {
        console.error("ServiceWorker registration failed: ", err);
      });
  });
}
document.addEventListener("keypress", handlekeypress);

document.addEventListener("DOMContentLoaded", function () {
  const videoContainer = document.getElementById("videoContainer");

  if (videoContainer !== null) {
    try {
      // Mostrar o contêiner do vídeo por 3 segundos
      videoContainer.style.display = "block";

      // Carregar o vídeo
      const video = document.createElement("video");
      video.src = "images/wfrtrans.mp4";
      video.autoplay = true;
      video.preload = "metadata"; // Carregar apenas os metadados do vídeo

      // Adicionar o vídeo ao contêiner
      videoContainer.appendChild(video);

      // Definir temporizador para ocultar o contêiner após 3 segundos
      setTimeout(function () {
        videoContainer.style.display = "none";
      }, 2500); // Tempo em milissegundos (3 segundos)
    } catch (error) {
      // Ignorar o erro
      console.error("Erro ao tentar mostrar o contêiner do vídeo:", error);
    }
  } else {
    console.error("Elemento com ID 'videoContainer' não encontrado.");
  }
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

function handlekeypress(event) {
  if (event.key === "Enter") {
    login();
  }
}

function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const data = {
    username: username,
    password: password,
  };

  // Enviar solicitação HTTP para validar o login
  fetch("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error("Login failed");
      }
    })
    .then((responseData) => {
      // Log da resposta recebida para a console
      console.log("Response:", responseData);

      // Salvar responseData no localStorage
      localStorage.setItem("responseData", JSON.stringify(responseData));

      // Reproduzir o vídeo e redirecionar após o término do vídeo
      playVideoAndRedirect(responseData);
    })
    .catch((error) => {
      // Se o login falhar, exiba uma mensagem de erro para o usuário
      console.error("Error:", error);
      alert("Login failed");
    });
}

function playVideoAndRedirect(data) {
  // Se o login for bem-sucedido, reproduza o vídeo e redirecione para outra página após 4 segundos
  const videoContainer = document.getElementById("videoContainer");
  const video = document.createElement("video");
  video.src = "images/wfrpausa.mp4";
  video.autoplay = true;
  video.preload = "metadata"; // Carrega apenas metadados do vídeo para obter dimensões

  // Exibindo o contêiner do vídeo e adicionando o vídeo ao DOM
  videoContainer.style.display = "block";
  videoContainer.appendChild(video);

  // Definindo o evento 'ended' para lidar com o término do vídeo
  video.addEventListener("ended", function () {
    console.log("Vídeo terminado!");
    checkUserTypeAndRedirect();
  });

  // Função para verificar o tipo de usuário e redirecionar
  function checkUserTypeAndRedirect() {
    const responseData = JSON.parse(localStorage.getItem("responseData"));
    if (
      (responseData && responseData.usertype === "admin") ||
      (responseData && responseData.usertype === "operator")
    ) {
      // Redireciona para a página de administração se o usuário for admin
      window.location.href = "/admin.html";
    } else {
      // Redireciona para a página de cliente se o usuário não for admin
      window.location.href = "/cliente.html";
    }
  }

  // Definir temporizador para verificar responseData após 5 segundos
  setTimeout(checkUserTypeAndRedirect, 5000);

  // Executar o vídeo
  video.play();
}

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

