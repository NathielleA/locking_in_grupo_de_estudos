"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import io from "socket.io-client";
import TodoList from "@/components/TodoList";
import PomodoroTimer from "@/components/PomodoroTimer";
import BackgroundUploader from "@/components/BackgroundUploader";
import MusicPlayer from "@/components/MusicPlayer";
import VideoRoom from "@/components/VideoRoom";
const VideoRoomAny = VideoRoom as any;

interface RoomPageProps {
    params: { roomId: string };
}

// Conecta ao Socket.io da rota API local
// Cria o socket apenas quando necessário, por aba
function createSocket() {
    return io(
        typeof window !== "undefined"
            ? window.location.origin
            : undefined,
        {
            path: "/api/socket"
        }
    );
}

export default function RoomPage({ params }: RoomPageProps) {
    const [backgroundUrl, setBackgroundUrl] = useState("/backgrounds/pixel-art-1.png");
    const [mounted, setMounted] = useState(false);
    const [isBreak, setIsBreak] = useState(false);
    const [name, setName] = useState("");
    // Removido joined para garantir reentrada
    const [showNameInput, setShowNameInput] = useState(true);
    const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);

    const searchParams = useSearchParams();
    // Next.js App Router: params pode ser Promise, precisa ser resolvido
    const [roomId, setRoomId] = useState<string>("");

    useEffect(() => {
        (async () => {
            if (typeof (params as any)?.then === "function") {
                const resolvedParams = await (params as any);
                setRoomId(resolvedParams.roomId);
            } else {
                setRoomId(params.roomId);
            }
        })();
    }, [params]);

    // Pega o nome da URL (?name=)
    useEffect(() => {
        const userName = searchParams?.get("name");
        if (userName) {
            setName(userName);
            setShowNameInput(false);
        }
    }, [searchParams]);

    // Efeito de montagem visual
    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 50);
        return () => clearTimeout(t);
    }, []);

    // Entra na sala pelo socket.io
    useEffect(() => {
        if (name && roomId && !showNameInput) {
            const s = createSocket();
            setSocket(s);
            s.emit("join", { roomId: String(roomId), name });
        }
    }, [name, roomId, showNameInput]);

    const handleBreakChange = (breakState: boolean) => {
        console.log("Agora é pausa?", breakState);
        setIsBreak(breakState);
    };

    const handleBackgroundChange = (url: string) => {
        setBackgroundUrl(url);
    };

    return (
        <main
            style={{
                padding: "2rem",
                fontFamily: "Arial, sans-serif",
                minHeight: "100vh",
                backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                transition: "background-image 0.3s",
                position: "relative",
                overflow: "hidden",
            }}
        >
            <h1 className="text-3xl font-bold text-white drop-shadow-md">
                Sala de Estudos: {roomId}
            </h1>
            {showNameInput ? (
                <div className="z-30 bg-black/70 p-8 rounded-2xl shadow-2xl text-center w-[90%] max-w-md border border-white/20 mx-auto mt-10">
                    <h2 className="text-xl font-bold text-white mb-4">Digite seu nome para entrar</h2>
                    <input
                        type="text"
                        placeholder="Seu nome..."
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full p-2 rounded-md border border-gray-400 bg-white/20 text-white placeholder-gray-300 mb-4"
                    />
                    <button
                        className="mt-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg w-full"
                        onClick={() => {
                            if (name.trim()) setShowNameInput(false);
                        }}
                    >
                        Entrar na sala
                    </button>
                </div>
            ) : (
                <>
                    <p className="text-gray-200">Olá, {name || "participante"}! 👋</p>
                    <hr className="my-8 border-gray-400/40" />

                    {/* Pomodoro + Lista de Tarefas */}
                    <div
                        className="absolute top-6 right-6 z-10 flex flex-col items-end gap-6"
                        aria-hidden={!mounted}
                    >
                        <div
                            className={`transform transition-all duration-700 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                                }`}
                        >
                            <PomodoroTimer onBreakChange={handleBreakChange} />
                        </div>

                        <div
                            className={`transform transition-all duration-700 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                                }`}
                            style={{ transitionDelay: mounted ? "120ms" : "0ms" }}
                        >
                            <TodoList />
                        </div>
                    </div>

                    <div className="fixed left-5 z-50">
                        {/* Música + Fundo */}
                        <div className="fixed left-5 bottom-5 flex gap-4 z-50">
                            <MusicPlayer />
                            <BackgroundUploader onBackgroundChange={handleBackgroundChange} />
                        </div>

                        {/* 🎥 VideoRoom com controle do Pomodoro */}
                        {socket && (
                            <VideoRoomAny
                                roomId={roomId}
                                userName={name}
                                socket={socket}
                                isBreak={isBreak}
                            />
                        )}
                    </div>
                </>
            )}
        </main>
    );
}
