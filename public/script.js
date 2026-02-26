const socket = io();
let username="";
const msgBox=document.getElementById("messages");
const typingDiv=document.getElementById("typing");
const input=document.getElementById("msg");

function join(){
    username=document.getElementById("username").value.trim();
    if(!username) return alert("Enter name");

    socket.emit("join",username);
    document.getElementById("loginDiv").style.display="none";
    document.getElementById("chatUI").style.display="block";
}

function addMessage(html){
    const div=document.createElement("div");
    div.className="msg";
    div.innerHTML=html;
    msgBox.appendChild(div);
    msgBox.scrollTop=msgBox.scrollHeight;
}

function send(){
    if(!input.value.trim()) return;
    socket.emit("chat message",input.value);
    input.value="";
    socket.emit("stopTyping");
}

input.addEventListener("keypress",e=>{
    socket.emit("typing");
    if(e.key==="Enter") send();
});

input.addEventListener("blur",()=>socket.emit("stopTyping"));

document.querySelectorAll(".emoji").forEach(e=>{
    e.onclick=()=> input.value+=e.textContent;
});

socket.on("chat message",data=>{
    const isMe=data.user===username;
    addMessage(`
        <div class="bubble ${isMe?"me":"other"}">
            <b>${data.user}</b>: ${data.text}
            <span class="time">${data.time}</span>
        </div>
    `);
});

socket.on("system",msg=>{
    addMessage(`<div class="text-center text-muted small">${msg}</div>`);
});

socket.on("typing",user=>{
    typingDiv.textContent=user+" is typing...";
});

socket.on("stopTyping",()=>{
    typingDiv.textContent="";
});
