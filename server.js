const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let messages = [];
let users = {};

io.on("connection", socket => {

    socket.on("join", username => {
        users[socket.id] = username;
        socket.emit("history", messages);
        io.emit("system", username + " joined");
    });

    socket.on("chat message", text => {
        const msg = {
            id: Date.now(),
            user: users[socket.id],
            text,
            time: new Date().toLocaleTimeString(),
            seen:false
        };
        messages.push(msg);
        io.emit("chat message", msg);
    });

    socket.on("seen", id=>{
        messages = messages.map(m=>{
            if(m.id===id) m.seen=true;
            return m;
        });
        io.emit("seen",id);
    });

    socket.on("disconnect", () => {
        const name = users[socket.id];
        delete users[socket.id];
        if(name) io.emit("system", name+" left");
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, ()=>console.log("Running on "+PORT));
