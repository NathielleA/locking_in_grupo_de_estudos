"use client";

import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import SimplePeer from "simple-peer";
import { v4 as uuidv4 } from "uuid";

/**
 Props:
  - roomId: string
  - isBreak: boolean  // do Pomodoro -> true when on break
  - localName: string
  - signalingUrl: string (ex: http://your-signaling-server:4000)
*/

export default function VideoRoom({ roomId, isBreak, localName = "User", signalingUrl }) {
    const socketRef = useRef(null);
    const localStreamRef = useRef(null);
    const peersRef = useRef({}); // map peerSocketId -> { peer, stream }
    const [peers, setPeers] = useState([]); // [{id, stream, muted, name}]
    const localVideoRef = useRef(null);

    // media states
    const [cameraOn, setCameraOn] = useState(false);
    const [micOn, setMicOn] = useState(false);

    useEffect(() => {
        socketRef.current = io(signalingUrl, { transports: ["websocket"] });

        const socket = socketRef.current;
        const mySocketId = socket.id; // may be undefined until connected

        socket.on("connect", () => {
            // request join after connect
            const uid = uuidv4();
            socket.emit("join-room", { roomId, userId: uid, name: localName });
        });

        socket.on("all-users", (otherSocketIds) => {
            // otherSocketIds: array of socket ids in room
            // create initiator peers to each other socket
            otherSocketIds.forEach((otherId) => {
                createPeer(otherId, true);
            });
        });

        socket.on("user-joined", ({ socketId, userId, name }) => {
            // someone else joined after us
            // we wait for them to exchange signals via 'signal' channel
            console.log("user-joined", socketId);
        });

        socket.on("signal", async ({ from, signal }) => {
            // incoming signal from 'from' socket
            if (!peersRef.current[from]) {
                // create non-initiator peer
                await createPeer(from, false);
            }
            peersRef.current[from].peer.signal(signal);
        });

        socket.on("user-left", ({ socketId }) => {
            // remove peer
            if (peersRef.current[socketId]) {
                peersRef.current[socketId].peer.destroy();
                delete peersRef.current[socketId];
                setPeers((p) => p.filter((x) => x.id !== socketId));
            }
        });

        return () => {
            // cleanup on unmount
            if (socketRef.current) {
                socketRef.current.emit("leave-room");
                socketRef.current.disconnect();
            }
            stopLocalStream();
            Object.values(peersRef.current).forEach(({ peer }) => peer.destroy());
            peersRef.current = {};
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId, signalingUrl, localName]);

    // helper: start local media (camera &/or mic)
    const startLocalStream = async ({ video = true, audio = true } = {}) => {
        try {
            const constraints = { video, audio };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            localStreamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            setCameraOn(video);
            setMicOn(audio);
        } catch (err) {
            console.error("getUserMedia error:", err);
            alert("Permissão de câmera/áudio negada ou não disponível.");
        }
    };

    const stopLocalStream = () => {
        const s = localStreamRef.current;
        if (s) {
            s.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
        }
        setCameraOn(false);
        setMicOn(false);
    };

    // createPeer: create and register a simple-peer instance
    const createPeer = async (otherSocketId, initiator = false) => {
        // ensure we have at least local stream (video might be off if user hasn't enabled)
        const localStream = localStreamRef.current;
        const config = {
            initiator,
            trickle: false,
            stream: localStream || undefined,
            config: {
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" }, // public STUN
                ],
            },
        };

        const peer = new SimplePeer(config);

        peer.on("signal", (signal) => {
            // send signal via socket to target
            socketRef.current.emit("signal", { to: otherSocketId, from: socketRef.current.id, signal });
        });

        peer.on("stream", (stream) => {
            // remote stream arrived
            peersRef.current[otherSocketId] = { peer, stream, name: otherSocketId };
            setPeers((prev) => {
                // prevent duplicates
                if (prev.some((p) => p.id === otherSocketId)) return prev;
                return [...prev, { id: otherSocketId, stream }];
            });
        });

        peer.on("close", () => {
            delete peersRef.current[otherSocketId];
            setPeers((p) => p.filter((x) => x.id !== otherSocketId));
        });

        peer.on("error", (err) => {
            console.warn("peer error", err);
        });

        peersRef.current[otherSocketId] = { peer, stream: null, name: otherSocketId };
        return peersRef.current[otherSocketId];
    };

    // UI actions
    const handleToggleCamera = async () => {
        if (!cameraOn) {
            // turn camera on (while respecting that mic may remain off)
            await startLocalStream({ video: true, audio: micOn }); // keep current mic state
            // re-negotiation: replace tracks on existing peers
            propagateLocalStreamToPeers();
        } else {
            // turn camera off (stop video tracks)
            if (localStreamRef.current) {
                localStreamRef.current.getVideoTracks().forEach((t) => t.stop());
            }
            setCameraOn(false);
            propagateLocalStreamToPeers();
        }
    };

    const handleToggleMic = async () => {
        if (!micOn) {
            // only allow mic on if isBreak === true
            if (!isBreak) {
                alert("Microfone só pode ser ligado durante os intervalos do Pomodoro.");
                return;
            }
            // enable mic (keep camera state)
            await startLocalStream({ video: cameraOn, audio: true });
            propagateLocalStreamToPeers();
        } else {
            // disable mic: stop audio tracks
            if (localStreamRef.current) {
                localStreamRef.current.getAudioTracks().forEach((t) => t.stop());
            }
            setMicOn(false);
            propagateLocalStreamToPeers();
        }
    };

    // When local stream changes we must replace existing tracks on peers (simple approach: destroy and recreate peer with new stream)
    const propagateLocalStreamToPeers = () => {
        // simpler: for each peer, replace tracks if supported
        Object.entries(peersRef.current).forEach(([otherId, obj]) => {
            const peer = obj.peer;
            try {
                // simple-peer doesn't provide replaceTrack directly in older versions; safer to destroy and create a new peer
                // but we can try replaceTrack if peer.streams exist
                if (peer && peer.streams && peer.streams[0]) {
                    const localStream = localStreamRef.current;
                    // attempt to replace tracks:
                    const senders = peer._pc && peer._pc.getSenders ? peer._pc.getSenders() : [];
                    localStream?.getTracks().forEach((track) => {
                        const sender = senders.find((s) => s.track && s.track.kind === track.kind);
                        if (sender) sender.replaceTrack(track).catch(() => { });
                    });
                }
            } catch (err) {
                console.warn("propagateLocalStream error", err);
            }
        });
    };

    // Render video elements
    return (
        <div className="bg-white/8 backdrop-blur-md rounded-2xl p-3 w-[360px]">
            <div className="flex items-center gap-2 mb-2">
                <strong>Salinha — {roomId}</strong>
            </div>

            <div className="mb-2">
                <video ref={localVideoRef} autoPlay muted playsInline className="w-full rounded-md bg-black" />
            </div>

            <div className="flex gap-2 mb-2">
                <button onClick={handleToggleCamera} className="px-2 py-1 bg-blue-500 rounded text-white">
                    {cameraOn ? "Desligar Câmera" : "Ligar Câmera"}
                </button>

                <button onClick={handleToggleMic} className="px-2 py-1 bg-green-500 rounded text-white">
                    {micOn ? "Desligar Microfone" : "Ligar Microfone"}
                </button>

                <button
                    onClick={() => {
                        // copy invite link
                        const url = `${window.location.origin}/room/${roomId}`;
                        navigator.clipboard?.writeText(url);
                        alert("Link de convite copiado!");
                    }}
                    className="px-2 py-1 bg-gray-600 rounded text-white"
                >
                    Convidar
                </button>
            </div>

            <div className="space-y-2">
                {peers.map((p) => (
                    <RemoteVideo key={p.id} stream={p.stream} />
                ))}
            </div>
        </div>
    );
}

// small component that renders a MediaStream into a <video>
function RemoteVideo({ stream }) {
    const ref = useRef();
    useEffect(() => {
        if (ref.current && stream) {
            ref.current.srcObject = stream;
            ref.current.play?.();
        }
    }, [stream]);
    return (
        <video ref={ref} autoPlay playsInline className="w-full h-28 rounded-md bg-black" />
    );
}
