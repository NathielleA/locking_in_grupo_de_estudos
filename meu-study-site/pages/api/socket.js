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

            socket.on("join", (data) => {
                // data: { roomId, name }
                socket.join(data.roomId);
                socket.data = { name: data.name };
                const clients = io.sockets.adapter.rooms.get(data.roomId);
                console.log("Sala", data.roomId, ":", clients.size, "conectado(s)");

                // Envia para todos na sala o nome do novo participante
                io.to(data.roomId).emit("user-joined", { id: socket.id, name: data.name });

                if (clients.size === 2) {
                    // só o segundo recebe "ready"
                    const [firstClientId] = [...clients];
                    const secondClientId = [...clients][1];
                    io.to(secondClientId).emit("ready");
                }
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
