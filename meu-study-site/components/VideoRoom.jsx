"use client";
import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

let socket;

export default function VideoRoom({ userName, roomId }) {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCamOn, setIsCamOn] = useState(true);
    const [link, setLink] = useState("");

    useEffect(() => {
        // inicia o socket conectado ao backend /api/socket
        socket = io({
            path: "/api/socket",
        });

        socket.emit("join", roomId);
        setLink(window.location.href);

        let localStream;
        let peerConnection;
        const iceConfig = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

        navigator.mediaDevices
            .getUserMedia({ video: true, audio: true })
            .then((stream) => {
                localStream = stream;
                localVideoRef.current.srcObject = stream;

                peerConnection = new window.RTCPeerConnection(iceConfig);
                stream.getTracks().forEach((track) => {
                    peerConnection.addTrack(track, stream);
                });

                peerConnection.ontrack = (event) => {
                    remoteVideoRef.current.srcObject = event.streams[0];
                };

                peerConnection.onicecandidate = (event) => {
                    if (event.candidate) {
                        socket.emit("candidate", { roomId, candidate: event.candidate });
                    }
                };

                socket.on("ready", async () => {
                    // Se outro participante entrou, inicia oferta
                    const offer = await peerConnection.createOffer();
                    await peerConnection.setLocalDescription(offer);
                    socket.emit("offer", { roomId, offer });
                });

                socket.on("offer", async (offer) => {
                    await peerConnection.setRemoteDescription(new window.RTCSessionDescription(offer));
                    const answer = await peerConnection.createAnswer();
                    await peerConnection.setLocalDescription(answer);
                    socket.emit("answer", { roomId, answer });
                });

                socket.on("answer", async (answer) => {
                    await peerConnection.setRemoteDescription(new window.RTCSessionDescription(answer));
                });

                socket.on("candidate", async (candidate) => {
                    try {
                        await peerConnection.addIceCandidate(new window.RTCIceCandidate(candidate));
                    } catch (err) {
                        console.error("Erro ao adicionar candidate:", err);
                    }
                });
            })
            .catch((err) => console.error("Erro ao acessar câmera/microfone:", err));

        // limpa ao sair
        return () => {
            if (peerConnection) peerConnection.close();
            if (socket) socket.disconnect();
        };
    }, [roomId]);

    const toggleMic = () => {
        const stream = localVideoRef.current.srcObject;
        if (stream) {
            stream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
            setIsMicOn((prev) => !prev);
        }
    };

    const toggleCam = () => {
        const stream = localVideoRef.current.srcObject;
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
        <div className="mt-6 w-full flex flex-col items-center gap-4">
            <h1 className="text-2xl font-bold">Sala de Estudos: {roomId}</h1>
            <div className="flex gap-6 mt-4">
                <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    className="rounded-lg w-64 h-48 bg-black"
                />
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    className="rounded-lg w-64 h-48 bg-black"
                />
            </div>

            <div className="flex gap-4 mt-4">
                <button
                    onClick={toggleMic}
                    className={`px-4 py-2 rounded-lg font-semibold ${isMicOn ? "bg-green-500" : "bg-red-500"
                        }`}
                >
                    {isMicOn ? "Desligar Microfone" : "Ligar Microfone"}
                </button>
                <button
                    onClick={toggleCam}
                    className={`px-4 py-2 rounded-lg font-semibold ${isCamOn ? "bg-green-500" : "bg-red-500"
                        }`}
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
