const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const fs = require("fs");

const DB_FILE = "messages.json";

app.use(express.json());
app.use(express.static("public"));

function loadMessages(){
    if(!fs.existsSync(DB_FILE)) return [];
    return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveMessages(msgs){
    fs.writeFileSync(DB_FILE, JSON.stringify(msgs,null,2));
}

let messages = loadMessages();
let onlineUsers = {};

io.on("connection", socket => {

    socket.on("join", username=>{
        onlineUsers[socket.id] = username;
        io.emit("status", Object.values(onlineUsers));
        socket.emit("history", messages);
    });

    socket.on("chat", data=>{
        data.id = Date.now();
        data.reactions = {};
        messages.push(data);
        saveMessages(messages);
        io.emit("chat", data);
    });

    socket.on("edit", data=>{
        let msg = messages.find(m=>m.id===data.id);
        if(msg){
            msg.text = data.text;
            saveMessages(messages);
            io.emit("edit", msg);
        }
    });

    socket.on("delete", id=>{
        messages = messages.filter(m=>m.id!==id);
        saveMessages(messages);
        io.emit("delete", id);
    });

    socket.on("react", ({id,emoji,user})=>{
        let msg = messages.find(m=>m.id===id);
        if(!msg.reactions[emoji]) msg.reactions[emoji]=[];
        if(!msg.reactions[emoji].includes(user))
            msg.reactions[emoji].push(user);
        saveMessages(messages);
        io.emit("react",{id,reactions:msg.reactions});
    });

    socket.on("typing", user=>{
        socket.broadcast.emit("typing", user);
    });

    socket.on("seen", ()=>{
        socket.broadcast.emit("seen");
    });

    socket.on("disconnect", ()=>{
        delete onlineUsers[socket.id];
        io.emit("status", Object.values(onlineUsers));
    });
});

http.listen(3000,()=>console.log("Running on http://localhost:3000"));
