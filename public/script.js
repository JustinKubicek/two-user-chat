const socket = io();
let user="";

function join(){
    user=document.getElementById("username").value;
    if(!user) return;
    document.getElementById("loginBox").style.display="none";
    document.getElementById("chatUI").style.display="block";
    socket.emit("join",user);
}

function send(){
    let input=document.getElementById("msg");
    if(!input.value) return;

    socket.emit("chat",{
        user,
        text:input.value,
        time:new Date().toLocaleTimeString()
    });

    input.value="";
}

document.getElementById("msg").addEventListener("input",()=>{
    socket.emit("typing",user);
});

socket.on("history", msgs=>{
    msgs.forEach(addMsg);
});

socket.on("chat", msg=>{
    addMsg(msg);
});

socket.on("edit", msg=>{
    document.getElementById(msg.id).querySelector(".text").innerText=msg.text;
});

socket.on("delete", id=>{
    document.getElementById(id)?.remove();
});

socket.on("react", data=>{
    const div=document.getElementById(data.id).querySelector(".reactions");
    div.innerHTML="";
    for(let e in data.reactions){
        div.innerHTML+=`<span>${e} ${data.reactions[e].length}</span>`;
    }
});

socket.on("typing", u=>{
    document.getElementById("typing").innerText=u+" typing...";
    setTimeout(()=>document.getElementById("typing").innerText="",1500);
});

socket.on("status", users=>{
    document.getElementById("status").innerText="Online: "+users.join(", ");
});

socket.on("seen",()=>{
    let el=document.querySelector(".seen");
    if(el) el.innerText="Seen";
});

function addMsg(msg){
    let box=document.getElementById("chatBox");
    let div=document.createElement("div");
    div.id=msg.id;
    div.className="msg "+(msg.user===user?"me":"them");

    div.innerHTML=`
        <div class="sender">${msg.user}</div>
        <div class="text">${msg.text}</div>
        <div class="time">${msg.time}</div>

        <div class="actions">
            ✏️ <span onclick="editMsg(${msg.id})">Edit</span>
            🗑 <span onclick="delMsg(${msg.id})">Delete</span>
            😊 <span onclick="react(${msg.id})">React</span>
        </div>

        <div class="reactions"></div>
        <div class="seen"></div>
    `;

    box.appendChild(div);
    box.scrollTop=box.scrollHeight;

    if(msg.user!==user) socket.emit("seen");
}

function editMsg(id){
    let text=prompt("Edit message");
    if(text) socket.emit("edit",{id,text});
}

function delMsg(id){
    socket.emit("delete",id);
}

function react(id){
    let emoji=prompt("Emoji?");
    if(emoji) socket.emit("react",{id,emoji,user});
}

function toggleDark(){
    document.body.classList.toggle("dark");
}
