const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const Database = require("better-sqlite3");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));
app.use(express.json());

/* ---------- DATABASE ---------- */
const db = new Database("chat.db");

db.prepare(`
CREATE TABLE IF NOT EXISTS users(
username TEXT PRIMARY KEY,
password TEXT
)`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS messages(
id INTEGER PRIMARY KEY AUTOINCREMENT,
user TEXT,
text TEXT,
time TEXT,
seen INTEGER
)`).run();

/* ---------- LOGIN API ---------- */
app.post("/login",(req,res)=>{
    const {username,password} = req.body;
    if(!username || !password) return res.json({ok:false});

    const user = db.prepare("SELECT * FROM users WHERE username=?").get(username);

    if(!user){
        db.prepare("INSERT INTO users VALUES (?,?)").run(username,password);
        return res.json({ok:true});
    }

    if(user.password===password) return res.json({ok:true});
    res.json({ok:false});
});

/* ---------- SOCKET ---------- */
let onlineUsers={};

io.on("connection", socket=>{

    socket.on("join", username=>{
        onlineUsers[socket.id]=username;

        const history = db.prepare("SELECT * FROM messages").all();
        socket.emit("history",history);

        io.emit("system",username+" joined");
    });

    socket.on("typing",()=>{
        socket.broadcast.emit("typing",onlineUsers[socket.id]);
    });

    socket.on("stopTyping",()=>{
        socket.broadcast.emit("stopTyping");
    });

    socket.on("chat message", text=>{
        const user=onlineUsers[socket.id];
        const time=new Date().toLocaleTimeString();

        const result=db.prepare(
            "INSERT INTO messages(user,text,time,seen) VALUES(?,?,?,0)"
        ).run(user,text,time);

        const msg={id:result.lastInsertRowid,user,text,time,seen:0};
        io.emit("chat message",msg);
    });

    socket.on("seen", id=>{
        db.prepare("UPDATE messages SET seen=1 WHERE id=?").run(id);
        io.emit("seen",id);
    });

    socket.on("edit",({id,text})=>{
        db.prepare("UPDATE messages SET text=? WHERE id=?").run(text,id);
        io.emit("edit",{id,text});
    });

    socket.on("delete",id=>{
        db.prepare("DELETE FROM messages WHERE id=?").run(id);
        io.emit("delete",id);
    });

    socket.on("disconnect",()=>{
        const name=onlineUsers[socket.id];
        delete onlineUsers[socket.id];
        if(name) io.emit("system",name+" left");
    });
});

const PORT=process.env.PORT||3000;
server.listen(PORT,()=>console.log("Running "+PORT));
