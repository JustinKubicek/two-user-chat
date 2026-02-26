
const socket = io();

const input = document.getElementById("messageInput");
const button = document.getElementById("sendBtn");
const messages = document.getElementById("messages");

function sendMessage(){
    if(input.value.trim() !== ""){
        socket.emit("chat message", input.value);
        input.value = "";
    }
}

button.onclick = sendMessage;

input.addEventListener("keypress", e=>{
    if(e.key === "Enter") sendMessage();
});

socket.on("chat message", msg=>{
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.textContent = msg;
    messages.appendChild(li);
    messages.scrollTop = messages.scrollHeight;
});
