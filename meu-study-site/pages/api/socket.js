import { Server } from "socket.io";

let io;

export default function handler(req, res) {
    if (!io) {
        io = new Server(res.socket.server, {
            path: "/api/socket",
            cors: { origin: "*" },
        });
        res.socket.server.io = io;

        io.on("connection", (socket) => {
            console.log("Novo cliente:", socket.id);

            socket.on("join", (roomId) => {
                socket.join(roomId);
                const clients = io.sockets.adapter.rooms.get(roomId);
                if (clients && clients.size > 1) io.to(roomId).emit("ready");
            });

            socket.on("offer", (data) => {
                socket.to(data.roomId).emit("offer", data.offer);
            });

            socket.on("answer", (data) => {
                socket.to(data.roomId).emit("answer", data.answer);
            });

            socket.on("candidate", (data) => {
                socket.to(data.roomId).emit("candidate", data.candidate);
            });
        });
        console.log("✅ Socket.IO server iniciado");
    }
    res.end();
}
