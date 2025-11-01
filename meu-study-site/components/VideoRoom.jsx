"use client";
import { useEffect, useRef, useState } from "react";



export default function VideoRoom({ userName, roomId, socket }) {
    const localVideoRef = useRef(null);
    const localStreamRef = useRef(null);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCamOn, setIsCamOn] = useState(true);
    const [link, setLink] = useState("");
    const [participants, setParticipants] = useState([]);
    // Mapeia id do participante para RTCPeerConnection e video
    const peersRef = useRef({}); // { [id]: RTCPeerConnection }
    const remoteStreamsRef = useRef({}); // { [id]: MediaStream }
    const [, forceUpdate] = useState({}); // Para forçar re-render

    useEffect(() => {
        if (!roomId || !socket) return;

        socket.emit("join", { roomId, name: userName });
        setLink(`${window.location.origin}/room/${roomId}`);

        socket.off("user-joined");
        socket.on("user-joined", (data) => {
            setParticipants((prev) => {
                if (prev.find((p) => p.id === data.id)) return prev;
                return [...prev, data];
            });
            forceUpdate({});
            // Envia 'ready' para todos os outros participantes (menos si mesmo)
            if (socket && data.id !== socket.id) {
                socket.emit("ready", { from: socket.id, to: data.id, roomId });
            }
            console.log(`Novo participante: ${data.name}`);
        });

        // Inicializa stream local
        (async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                localStreamRef.current = stream;
                if (localVideoRef.current) localVideoRef.current.srcObject = stream;
                // Cria peers para todos os participantes já presentes (exceto si mesmo)
                participants.filter(p => p.id !== socket.id).forEach(p => {
                    if (!peersRef.current[p.id]) {
                        const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
                        peersRef.current[p.id] = pc;
                        stream.getTracks().forEach(track => pc.addTrack(track, stream));
                        pc.ontrack = (event) => {
                            remoteStreamsRef.current[p.id] = event.streams[0];
                            forceUpdate({});
                        };
                        pc.onicecandidate = (event) => {
                            if (event.candidate) {
                                socket.emit("candidate", { roomId, candidate: event.candidate, to: p.id });
                            }
                        };
                        // Oferta só se o peer estiver em estado 'stable'
                        (async () => {
                            if (pc.signalingState === "stable") {
                                const offer = await pc.createOffer();
                                await pc.setLocalDescription(offer);
                                socket.emit("offer", { roomId, offer, to: p.id });
                            }
                        })();
                    }
                });
            } catch (err) {
                console.error("Erro ao acessar câmera/microfone:", err);
            }
        })();

        // Handlers de sinalização para múltiplos peers
        socket.off("ready");
        socket.off("offer");
        socket.off("answer");
        socket.off("candidate");

        // Quando outro participante entra, crie peer para ele
        socket.on("ready", async ({ from }) => {
            if (!from || from === socket.id) return;
            if (peersRef.current[from]) return;
            if (!localStreamRef.current) {
                // Aguarda stream local ser inicializada
                const waitForStream = setInterval(() => {
                    if (localStreamRef.current) {
                        clearInterval(waitForStream);
                        const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
                        peersRef.current[from] = pc;
                        localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));
                        pc.ontrack = (event) => {
                            remoteStreamsRef.current[from] = event.streams[0];
                            forceUpdate({});
                        };
                        pc.onicecandidate = (event) => {
                            if (event.candidate) {
                                socket.emit("candidate", { roomId, candidate: event.candidate, to: from });
                            }
                        };
                        // Oferta
                        (async () => {
                            const offer = await pc.createOffer();
                            await pc.setLocalDescription(offer);
                            socket.emit("offer", { roomId, offer, to: from });
                        })();
                    }
                }, 100);
                return;
            }
            const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
            peersRef.current[from] = pc;
            localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));
            pc.ontrack = (event) => {
                remoteStreamsRef.current[from] = event.streams[0];
                forceUpdate({});
            };
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("candidate", { roomId, candidate: event.candidate, to: from });
                }
            };
            // Oferta
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("offer", { roomId, offer, to: from });
        });

        // Recebe oferta de outro participante
        socket.on("offer", async ({ offer, from }) => {
            if (!from || from === socket.id) return;
            let pc = peersRef.current[from];
            if (!pc) {
                pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
                peersRef.current[from] = pc;
                localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));
                pc.ontrack = (event) => {
                    remoteStreamsRef.current[from] = event.streams[0];
                    forceUpdate({});
                };
                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        socket.emit("candidate", { roomId, candidate: event.candidate, to: from });
                    }
                };
            }
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("answer", { roomId, answer, to: from });
        });

        // Recebe answer
        socket.on("answer", async ({ answer, from }) => {
            if (!from || from === socket.id) return;
            const pc = peersRef.current[from];
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            }
        });

        // Recebe candidate
        socket.on("candidate", async ({ candidate, from }) => {
            if (!from || from === socket.id) return;
            const pc = peersRef.current[from];
            if (pc) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    console.warn("Erro ao adicionar candidate:", err);
                }
            }
        });

        return () => {
            Object.values(peersRef.current).forEach(pc => pc.close());
            if (localStreamRef.current)
                localStreamRef.current.getTracks().forEach((t) => t.stop());
            socket.off("user-joined");
            socket.off("ready");
            socket.off("offer");
            socket.off("answer");
            socket.off("candidate");
        };
    }, [roomId, socket]);

    const toggleMic = () => {
        const stream = localVideoRef.current?.srcObject;
        if (stream) {
            stream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
            setIsMicOn((prev) => !prev);
        }
    };

    const toggleCam = () => {
        const stream = localVideoRef.current?.srcObject;
        if (stream) {
            stream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
            setIsCamOn((prev) => !prev);
        }
    };

    const handleInvite = async () => {
        await navigator.clipboard.writeText(link);
        alert("Link copiado para a área de transferência!");
    };

    return (
        <div className="mt-6 w-full flex flex-col items-center gap-4 text-white">
            <h1 className="text-2xl font-bold">Sala de Estudos: {roomId}</h1>

            <div className="flex gap-6 mt-4">
                {/* Sempre mostra o vídeo local */}
                <video ref={localVideoRef} autoPlay muted playsInline className="rounded-lg w-64 h-48 bg-black" />
                {/* Renderiza vídeo de cada participante remoto */}
                {participants.filter(p => p.id !== socket.id).map(p => (
                    <video
                        key={p.id}
                        autoPlay
                        playsInline
                        className="rounded-lg w-64 h-48 bg-black"
                        ref={el => {
                            if (el && remoteStreamsRef.current[p.id]) {
                                el.srcObject = remoteStreamsRef.current[p.id];
                            }
                        }}
                    />
                ))}
            </div>

            {/* Lista de participantes */}
            <div className="mt-4 flex flex-col items-center gap-2">
                {participants.map((p) => (
                    <div key={p.id} className="bg-white/10 px-4 py-2 rounded text-white flex items-center gap-2">
                        <span className="font-bold">{p.name}</span>
                        <span className="text-xs text-gray-300">({socket && p.id === socket.id ? "Você" : "Convidado"})</span>
                    </div>
                ))}
            </div>

            <div className="flex gap-4 mt-4">
                <button
                    onClick={toggleMic}
                    className={`px-4 py-2 rounded-lg font-semibold ${isMicOn ? "bg-green-500" : "bg-red-500"}`}
                >
                    {isMicOn ? "Desligar Microfone" : "Ligar Microfone"}
                </button>
                <button
                    onClick={toggleCam}
                    className={`px-4 py-2 rounded-lg font-semibold ${isCamOn ? "bg-green-500" : "bg-red-500"}`}
                >
                    {isCamOn ? "Desligar Câmera" : "Ligar Câmera"}
                </button>
                <button
                    onClick={handleInvite}
                    className="px-4 py-2 rounded-lg font-semibold bg-blue-500 hover:bg-blue-600"
                >
                    Convidar
                </button>
            </div>
        </div>
    );
}
