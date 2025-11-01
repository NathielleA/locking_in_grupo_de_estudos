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

                if (clients.size > 1) {
                    // Todos os outros participantes recebem "ready" do novo
                    [...clients].forEach((clientId) => {
                        if (clientId !== socket.id) {
                            io.to(clientId).emit("ready", { from: socket.id });
                            // O novo também recebe "ready" dos outros
                            io.to(socket.id).emit("ready", { from: clientId });
                        }
                    });
                }
            });

            socket.on("offer", (data) => {
                if (data.to) {
                    io.to(data.to).emit("offer", { offer: data.offer, from: socket.id });
                }
            });

            socket.on("answer", (data) => {
                if (data.to) {
                    io.to(data.to).emit("answer", { answer: data.answer, from: socket.id });
                }
            });

            socket.on("candidate", (data) => {
                if (data.to) {
                    io.to(data.to).emit("candidate", { candidate: data.candidate, from: socket.id });
                }
            });
        });

        console.log("✅ Socket.IO server iniciado");
    }
    res.end();
}
