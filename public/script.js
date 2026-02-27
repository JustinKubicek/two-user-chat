const socket=io();
let username="";
const box=messages;
const input=msg;

/* LOGIN */
async function login(){
const u=user.value.trim();
if(!u)return alert("enter name");

const res=await fetch("/login",{method:"POST",headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u})});
const data=await res.json();
if(!data.ok)return;

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

<div class="reactions" id="react-${m.id}">
${(m.reactions||[]).map(r=>`<span>${r}</span>`).join("")}
</div>

<div class="actions">
<span onclick="react(${m.id},'👍')">👍</span>
<span onclick="react(${m.id},'❤️')">❤️</span>
<span onclick="react(${m.id},'😂')">😂</span>
<span onclick="react(${m.id},'😮')">😮</span>
<span onclick="react(${m.id},'😢')">😢</span>
${me?` | <span onclick="editMsg(${m.id})">edit</span>
| <span onclick="deleteMsg(${m.id})">delete</span>`:""}
</div>

</div></div>`;
}

function add(h){
box.insertAdjacentHTML("beforeend",h);
box.scrollTop=box.scrollHeight;
}

/* SEND */
function send(){
if(!input.value.trim())return;
socket.emit("chat message",input.value);
input.value="";
socket.emit("stopTyping");
}

input.addEventListener("input",()=>socket.emit("typing"));
input.addEventListener("keypress",e=>{if(e.key==="Enter")send();});

/* SOCKET EVENTS */
socket.on("history",msgs=>msgs.forEach(m=>add(bubble(m))));
socket.on("chat message",m=>{
add(bubble(m));
if(m.user!==username)setTimeout(()=>socket.emit("seen",m.id),400);
});

socket.on("presence",list=>{
online.textContent="Online: "+list.join(", ");
});

socket.on("typing",u=>typing.textContent=u+" typing...");
socket.on("stopTyping",()=>typing.textContent="");

socket.on("seen",id=>{
const el=document.querySelector(`#msg-${id} .meta`);
if(el) el.innerHTML=el.innerHTML.replace("✔","✔✔");
});

socket.on("react",({id,emoji})=>{
document.getElementById("react-"+id)
.insertAdjacentHTML("beforeend",`<span>${emoji}</span>`);
});

socket.on("edit",({id,text})=>{
document.querySelector(`#msg-${id} .text`).textContent=text;
});

socket.on("delete",id=>{
document.getElementById("msg-"+id)?.remove();
});

socket.on("system",msg=>add(`<div class="text-center small text-muted">${msg}</div>`));

/* ACTIONS */
function editMsg(id){
const t=prompt("Edit:");
if(t) socket.emit("edit",{id,text:t});
}
function deleteMsg(id){
if(confirm("Delete?")) socket.emit("delete",id);
}
function react(id,emoji){
socket.emit("react",{id,emoji});
}

/* DARK MODE */
function toggleDark(){document.body.classList.toggle("dark");}
