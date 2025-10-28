"use client";
import { useState, useEffect } from "react";
import TodoList from "@/components/TodoList";
import PomodoroTimer from "@/components/PomodoroTimer";
import BackgroundUploader from "@/components/BackgroundUploader";
import MusicPlayer from "@/components/MusicPlayer";
import VideoRoom from "@/components/VideoRoom";

export default function Home() {
  const [backgroundUrl, setBackgroundUrl] = useState<string>("/backgrounds/pixel-art-1.png");
  const [mounted, setMounted] = useState(false);
  const [isBreak, setIsBreak] = useState(false); // 👈 controle vindo do Pomodoro

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

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
        Minha Sala de Estudos em Grupo
      </h1>
      <p className="text-gray-200">Bem-vindo ao seu espaço de foco!</p>

      <hr className="my-8 border-gray-400/40" />

      {/* Agrupando Pomodoro e ToDoList no canto direito */}
      <div
        className="absolute top-6 right-6 z-10 flex flex-col items-end gap-6"
        aria-hidden={!mounted}
      >
        {/* Pomodoro */}
        <div
          className={`transform transition-all duration-700 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
        >
          <PomodoroTimer onBreakChange={handleBreakChange} />
        </div>

        {/* ToDoList */}
        <div
          className={`transform transition-all duration-700 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
          style={{ transitionDelay: mounted ? "120ms" : "0ms" }}
        >
          <TodoList />
        </div>
      </div>

      {/* Sidebar esquerda com Música e Fundo */}
      <div className="fixed left-5 bottom-5 flex flex-col gap-4 z-50">
        <MusicPlayer />
        <BackgroundUploader onBackgroundChange={handleBackgroundChange} />
      </div>

      {/* 🎥 VideoRoom - fixo no topo esquerdo */}
      <div className="fixed left-5 top-5 z-50">
        <VideoRoom
          roomId="default-room"
          isBreak={isBreak}
          signalingUrl="wss://your-signaling-server-url"
        />
      </div>
    </main>
  );
}
