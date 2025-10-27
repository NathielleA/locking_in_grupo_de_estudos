"use client";
import { useState } from "react";
import TodoList from "@/components/TodoList";
import PomodoroTimer from "@/components/PomodoroTimer";
import BackgroundUploader from "@/components/BackgroundUploader";

export default function Home() {
  const [backgroundUrl, setBackgroundUrl] = useState<string>(
    "/backgrounds/pixel-art-1.png"
  );

  const handleBreakChange = (isBreak: boolean) => {
    console.log("Agora é pausa?", isBreak);
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
      <div className="absolute top-6 right-6 flex flex-col items-end gap-6 z-10">
        <PomodoroTimer onBreakChange={handleBreakChange} />
        <TodoList />
      </div>

      {/* Resto do conteúdo */}
      <div className="mt-24 max-w-3xl">
        <BackgroundUploader onBackgroundChange={handleBackgroundChange} />
      </div>
    </main>
  );
}
