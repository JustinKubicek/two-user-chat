const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const Database = require("better-sqlite3");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));
app.use(express.json());

/* DATABASE */
const db = new Database("chat.db");

db.prepare(`
CREATE TABLE IF NOT EXISTS users(
username TEXT PRIMARY KEY
)`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS messages(
id INTEGER PRIMARY KEY AUTOINCREMENT,
user TEXT,
text TEXT,
time TEXT,
seen INTEGER,
reactions TEXT
)`).run();

/* LOGIN (username only) */
app.post("/login",(req,res)=>{
    const {username}=req.body;
    if(!username) return res.json({ok:false});

    const exists=db.prepare("SELECT * FROM users WHERE username=?").get(username);
    if(!exists) db.prepare("INSERT INTO users VALUES(?)").run(username);

    res.json({ok:true});
});

/* ONLINE USERS */
let online={};

io.on("connection",socket=>{

    socket.on("join",username=>{
        online[socket.id]=username;

        const history=db.prepare("SELECT * FROM messages").all()
        .map(m=>({...m,reactions: m.reactions?JSON.parse(m.reactions):[]}));

        socket.emit("history",history);
        io.emit("presence",Object.values(online));
        io.emit("system",username+" joined");
    });

    socket.on("typing",()=>socket.broadcast.emit("typing",online[socket.id]));
    socket.on("stopTyping",()=>socket.broadcast.emit("stopTyping"));

    socket.on("chat message",text=>{
        const user=online[socket.id];
        const time=new Date().toLocaleTimeString();

        const r=db.prepare(
        "INSERT INTO messages(user,text,time,seen,reactions) VALUES(?,?,?,0,'[]')"
        ).run(user,text,time);

        const msg={id:r.lastInsertRowid,user,text,time,seen:0,reactions:[]};
        io.emit("chat message",msg);
    });

    socket.on("seen",id=>{
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

    socket.on("react",({id,emoji})=>{
        const msg=db.prepare("SELECT reactions FROM messages WHERE id=?").get(id);
        let arr=msg.reactions?JSON.parse(msg.reactions):[];
        arr.push(emoji);

        db.prepare("UPDATE messages SET reactions=? WHERE id=?")
        .run(JSON.stringify(arr),id);

        io.emit("react",{id,emoji});
    });

    socket.on("disconnect",()=>{
        delete online[socket.id];
        io.emit("presence",Object.values(online));
    });

});

const PORT=process.env.PORT||3000;
server.listen(PORT,()=>console.log("Running "+PORT));
