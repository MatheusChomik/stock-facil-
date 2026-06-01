document.getElementById("loginForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const usuario = document.getElementById("usuario").value;
    const senha = document.getElementById("senha").value;

    if (usuario === "admin" && senha === "1234") {
    window.location.href = "dashboard.html";
}
else if (usuario === "operador" && senha === "5678") {
    window.location.href = "../tela OPERADOR chomik e fideles/painel.html";
}

    else {
        alert("Usuário ou senha incorretos!");
    }
});