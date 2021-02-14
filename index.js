const express = require("express");
const app = express();
const PORT = 5000;
const http = require("http");
const socketio = require("socket.io");

const redis = require("redis");
const client = redis.createClient();

app.set("view engine", "ejs");

const server = http.createServer(app);
const io = socketio(server).listen(server);

function sendMessage(socket) {
    client.lrange("messages", "0", "-1", (err, data) => {
        data.map(x => {
            const usernameMessage = x.split(":");
            const redisUsername = usernameMessage[0];
            const redisMessage = usernameMessage[1];

            socket.emit("message", {
                from: redisUsername,
                message: redisMessage
            });
        });
    });
}

io.on("connection", socket => {
    sendMessage(socket);

    socket.on("message", ({ message, from }) => {
        client.rpush("messages", `${from}:${message}`);

        io.emit("message", { from, message });
    });
});

app.get("/chat", (req, res) => {
    const username = req.query.username;

    io.emit("joined", username);
    res.render("chat", { username });
});

app.get("/", (req, res) => {
    res.render("index");
});

server.listen(PORT, () => {
    console.log(`Server at ${PORT}`);
});
