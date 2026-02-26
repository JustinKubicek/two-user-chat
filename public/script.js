const socket = io();

let username = "";
const box = document.getElementById("messages");
const input = document.getElementById("msg");

function join(){
    username = document.getElementById("username").value.trim();
    if(!username) return alert("Enter name");

    socket.emit("join",username);

    document.getElementById("loginDiv").style.display="none";
    document.getElementById("chatUI").style.display="block";
}

function bubble(m){
    const me = m.user === username;

    return `
    <div class="msg ${me?"me":"other"}" id="msg-${m.id}">
        <div class="bubble">
            <b>${m.user}</b>: ${m.text}
            <span class="meta">
                ${m.time}
                ${me ? (m.seen ? " ✔✔" : " ✔") : ""}
            </span>
        </div>
    </div>`;
}

function add(html){
    box.insertAdjacentHTML("beforeend", html);
    box.scrollTop = box.scrollHeight;
}

function send(){
    if(!input.value.trim()) return;
    socket.emit("chat message", input.value);
    input.value="";
}

input.addEventListener("keypress", e=>{
    if(e.key==="Enter") send();
});

document.querySelectorAll(".emoji").forEach(e=>{
    e.onclick=()=> input.value += e.textContent;
});

socket.on("history", msgs=>{
    msgs.forEach(m=> add(bubble(m)));
});

socket.on("chat message", m=>{
    add(bubble(m));

    if(m.user !== username){
        setTimeout(()=> socket.emit("seen", m.id), 400);
    }
});

socket.on("seen", id=>{
    const el = document.querySelector("#msg-"+id+" .meta");
    if(el) el.innerHTML = el.innerHTML.replace("✔","✔✔");
});

socket.on("system", msg=>{
    add(`<div class="text-center small text-muted">${msg}</div>`);
});

function toggleDark(){
    document.body.classList.toggle("dark");
}
