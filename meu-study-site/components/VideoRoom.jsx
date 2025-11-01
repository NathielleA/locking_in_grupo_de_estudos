"use client";
import { useEffect, useRef, useState } from "react";

export default function VideoRoom({ userName, roomId, socket }) {
    const localVideoRef = useRef(null);
    const localStreamRef = useRef(null);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCamOn, setIsCamOn] = useState(true);
    const [link, setLink] = useState("");
    const [participants, setParticipants] = useState([]);
    const peersRef = useRef({});
    const remoteStreamsRef = useRef({});
    const [, forceUpdate] = useState({});

    useEffect(() => {
        // Recebe lista completa de participantes ao entrar na sala
        socket.off("participants-list");
        socket.on("participants-list", (list) => {
            if (Array.isArray(list)) {
                setParticipants(list);
                forceUpdate({});
                // Para cada participante já presente, cria peer connection e adiciona tracks
                list.forEach((p) => {
                    if (p.id !== socket.id && !peersRef.current[p.id]) {
                        const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
                        peersRef.current[p.id] = pc;
                        if (localStreamRef.current) {
                            localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));
                        }
                        pc.ontrack = (event) => {
                            remoteStreamsRef.current[p.id] = event.streams[0];
                            forceUpdate({});
                        };
                        pc.onicecandidate = (event) => {
                            if (event.candidate) {
                                socket.emit("candidate", { roomId, candidate: event.candidate, to: p.id });
                            }
                        };
                        // Envia ready para iniciar negociação
                        socket.emit("ready", { from: socket.id, to: p.id, roomId });
                    }
                });
            }
        });
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
            if (socket && data.id !== socket.id) {
                socket.emit("ready", { from: socket.id, to: data.id, roomId });
            }
        });

        (async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });
                localStreamRef.current = stream;
                if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            } catch (err) {
                console.error("Erro ao acessar câmera/microfone:", err);
            }
        })();

        socket.off("ready");
        socket.off("offer");
        socket.off("answer");
        socket.off("candidate");

        socket.on("ready", async ({ from }) => {
            if (!from || from === socket.id) return;
            if (peersRef.current[from]) return;

            const pc = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
            });
            peersRef.current[from] = pc;

            localStreamRef.current
                ?.getTracks()
                .forEach((track) => pc.addTrack(track, localStreamRef.current));

            pc.ontrack = (event) => {
                remoteStreamsRef.current[from] = event.streams[0];
                forceUpdate({});
            };

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("candidate", { roomId, candidate: event.candidate, to: from });
                }
            };

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("offer", { roomId, offer, to: from });
        });

        socket.on("offer", async ({ offer, from }) => {
            if (!from || from === socket.id) return;
            let pc = peersRef.current[from];
            if (!pc) {
                pc = new RTCPeerConnection({
                    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
                });
                peersRef.current[from] = pc;
                localStreamRef.current
                    ?.getTracks()
                    .forEach((track) => pc.addTrack(track, localStreamRef.current));
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

        socket.on("answer", async ({ answer, from }) => {
            const pc = peersRef.current[from];
            if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on("candidate", async ({ candidate, from }) => {
            const pc = peersRef.current[from];
            if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
        });

        return () => {
            Object.values(peersRef.current).forEach((pc) => pc.close());
            localStreamRef.current?.getTracks().forEach((t) => t.stop());
        };
    }, [roomId, socket]);

    const toggleMic = () => {
        const stream = localStreamRef.current;
        if (stream) {
            stream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
            setIsMicOn((prev) => !prev);
        }
    };

    const toggleCam = () => {
        const stream = localStreamRef.current;
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
        <div className="mt-6 w-full flex flex-col items-center gap-4 text-white backdrop-blur-xl bg-white/10 p-6 rounded-2xl shadow-lg border border-white/20">
            <h2 className="text-2xl font-semibold text-center">
                Sala de Estudos: <span className="text-blue-300">{roomId}</span>
            </h2>

            <div className="flex flex-wrap justify-center gap-6 mt-6">
                {/* Local video */}
                <div className="relative w-64 h-48 bg-black rounded-xl overflow-hidden shadow-md">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 left-2 bg-black/60 text-sm px-2 py-0.5 rounded">
                        {userName} (você)
                    </span>
                </div>

                {/* Remote videos */}
                {participants
                    .filter((p) => p.id !== socket.id)
                    .map((p) => (
                        <div
                            key={p.id}
                            className="relative w-64 h-48 bg-black rounded-xl overflow-hidden shadow-md"
                        >
                            <video
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                                ref={(el) => {
                                    if (el && remoteStreamsRef.current[p.id]) {
                                        el.srcObject = remoteStreamsRef.current[p.id];
                                    }
                                }}
                            />
                            <span className="absolute bottom-1 left-2 bg-black/60 text-sm px-2 py-0.5 rounded">
                                {p.name}
                            </span>
                        </div>
                    ))}
            </div>

            <div className="flex gap-3 mt-6">
                <button
                    onClick={toggleMic}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${isMicOn ? "bg-green-500/70 hover:bg-green-600/80" : "bg-red-500/70 hover:bg-red-600/80"
                        }`}
                >
                    {isMicOn ? "Desligar Microfone" : "Ligar Microfone"}
                </button>
                <button
                    onClick={toggleCam}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${isCamOn ? "bg-green-500/70 hover:bg-green-600/80" : "bg-red-500/70 hover:bg-red-600/80"
                        }`}
                >
                    {isCamOn ? "Desligar Câmera" : "Ligar Câmera"}
                </button>
                <button
                    onClick={handleInvite}
                    className="px-4 py-2 rounded-lg font-semibold bg-blue-500/70 hover:bg-blue-600/80 transition"
                >
                    Convidar
                </button>
            </div>
        </div>
    );
}
