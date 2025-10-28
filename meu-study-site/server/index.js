// server/index.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*" }, // ajuste origin em produção
});

const PORT = process.env.PORT || 4000;

// manter mapa de rooms -> socketIds
const rooms = {};

io.on("connection", (socket) => {
    console.log("socket connected:", socket.id);

    socket.on("join-room", ({ roomId, userId, name }) => {
        socket.join(roomId);
        rooms[roomId] = rooms[roomId] || new Set();
        rooms[roomId].add(socket.id);

        // informar quem já está na sala (outros sockets)
        const otherSockets = Array.from(rooms[roomId]).filter((id) => id !== socket.id);
        socket.emit("all-users", otherSockets);

        // avisar aos outros que novo entrou (opcional)
        socket.to(roomId).emit("user-joined", { socketId: socket.id, userId, name });

        // store room in socket for cleanup
        socket.data.roomId = roomId;
    });

    socket.on("signal", ({ to, from, signal }) => {
        // reencaminha o sinal para o destinatário
        io.to(to).emit("signal", { from, signal });
    });

    socket.on("leave-room", () => {
        const roomId = socket.data.roomId;
        if (roomId && rooms[roomId]) {
            rooms[roomId].delete(socket.id);
            socket.to(roomId).emit("user-left", { socketId: socket.id });
            socket.leave(roomId);
        }
    });

    socket.on("disconnect", () => {
        const roomId = socket.data.roomId;
        if (roomId && rooms[roomId]) {
            rooms[roomId].delete(socket.id);
            socket.to(roomId).emit("user-left", { socketId: socket.id });
        }
        console.log("socket disconnected:", socket.id);
    });
});

app.get("/", (req, res) => res.send("Signaling server alive"));
server.listen(PORT, () => console.log(`Signaling server listening on ${PORT}`));
