const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

io.on("connection", socket => {

    socket.on("join", username => {
        socket.username = username;
        io.emit("system", username + " joined");
    });

    socket.on("typing", () => {
        socket.broadcast.emit("typing", socket.username);
    });

    socket.on("stopTyping", () => {
        socket.broadcast.emit("stopTyping");
    });

    socket.on("chat message", msg => {
        io.emit("chat message", {
            user: socket.username,
            text: msg,
            time: new Date().toLocaleTimeString()
        });
    });

    socket.on("disconnect", () => {
        if(socket.username)
            io.emit("system", socket.username + " left");
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Running on " + PORT));
