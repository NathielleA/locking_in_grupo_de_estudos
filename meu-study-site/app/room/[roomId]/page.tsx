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
const socket = io(
    typeof window !== "undefined"
        ? window.location.origin
        : undefined,
    {
        path: "/api/socket"
    }
);

export default function RoomPage({ params }: RoomPageProps) {
    const [backgroundUrl, setBackgroundUrl] = useState("/backgrounds/pixel-art-1.png");
    const [mounted, setMounted] = useState(false);
    const [isBreak, setIsBreak] = useState(false);
    const [name, setName] = useState("");
    const [joined, setJoined] = useState(false);

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
        if (userName) setName(userName);
    }, [searchParams]);

    // Efeito de montagem visual
    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 50);
        return () => clearTimeout(t);
    }, []);

    // Entra na sala pelo socket.io
    useEffect(() => {
        if (name && roomId && !joined) {
            socket.emit("join", roomId);
            setJoined(true);
        }
    }, [name, roomId, joined]);

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
                <VideoRoomAny
                    roomId={roomId}
                    userName={name}
                    socket={socket}
                    isBreak={isBreak}
                />
            </div>

        </main>
    );
}
