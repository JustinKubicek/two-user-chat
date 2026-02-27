const socket=io();
let username="";
const box=document.getElementById("messages");
const typingDiv=document.getElementById("typing");
const input=document.getElementById("msg");

/* LOGIN */
async function login(){
    const u=user.value.trim();
    const p=pass.value.trim();
    if(!u||!p) return alert("enter credentials");

    const res=await fetch("/login",{method:"POST",headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p})});
    const data=await res.json();

    if(!data.ok) return alert("Wrong password");

    username=u;
    login.style.display="none";
    chatUI.style.display="block";
    socket.emit("join",username);
}

/* MESSAGE UI */
function bubble(m){
const me=m.user===username;

return `
<div class="msg ${me?"me":"other"}" id="msg-${m.id}">
<div class="bubble">
<b>${m.user}</b>: <span class="text">${m.text}</span>
<span class="meta">${m.time}${me?(m.seen?" ✔✔":" ✔"):""}</span>
${me?`<div class="actions">
<span onclick="editMsg(${m.id})">edit</span> |
<span onclick="deleteMsg(${m.id})">delete</span>
</div>`:""}
</div></div>`;
}

function add(html){
box.insertAdjacentHTML("beforeend",html);
box.scrollTop=box.scrollHeight;
}

/* SEND */
function send(){
if(!input.value.trim()) return;
socket.emit("chat message",input.value);
input.value="";
socket.emit("stopTyping");
}

input.addEventListener("input",()=>socket.emit("typing"));
input.addEventListener("keypress",e=>{if(e.key==="Enter")send();});

/* EMOJIS */
document.querySelectorAll(".emoji").forEach(e=>{
e.onclick=()=>input.value+=e.textContent;
});

/* SOCKET EVENTS */
socket.on("history",msgs=>msgs.forEach(m=>add(bubble(m))));

socket.on("chat message",m=>{
add(bubble(m));
if(m.user!==username)setTimeout(()=>socket.emit("seen",m.id),400);
});

socket.on("seen",id=>{
const el=document.querySelector("#msg-"+id+" .meta");
if(el) el.innerHTML=el.innerHTML.replace("✔","✔✔");
});

socket.on("typing",u=>typingDiv.textContent=u+" typing...");
socket.on("stopTyping",()=>typingDiv.textContent="");

socket.on("system",msg=>add(`<div class="text-center small text-muted">${msg}</div>`));

socket.on("edit",({id,text})=>{
document.querySelector(`#msg-${id} .text`).textContent=text;
});

socket.on("delete",id=>{
document.getElementById("msg-"+id)?.remove();
});

/* EDIT + DELETE */
function editMsg(id){
const newText=prompt("Edit message:");
if(newText) socket.emit("edit",{id,text:newText});
}
function deleteMsg(id){
if(confirm("Delete message?")) socket.emit("delete",id);
}

/* DARK MODE */
function toggleDark(){document.body.classList.toggle("dark");}
