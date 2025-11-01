"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export default function HomePage() {
  const [name, setName] = useState("");
  const [showPopup, setShowPopup] = useState(true);
  const router = useRouter();

  const handleCreateRoom = () => {
    if (!name.trim()) return alert("Digite seu nome para criar a sala!");
    const roomId = uuidv4();
    setShowPopup(false);
    router.push(`/room/${roomId}?name=${encodeURIComponent(name)}`);
  };

  return (
    <main className="relative h-screen w-screen flex items-center justify-center bg-[url('/backgrounds/pixel-art-1.png')] bg-cover bg-center">
      {showPopup && (
        <>
          {/* Fundo escurecido e embaçado */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-10" />

          {/* Pop-up central */}
          <div className="z-20 bg-white/10 p-8 rounded-2xl shadow-2xl backdrop-blur-lg text-center w-[90%] max-w-md border border-white/20">
            <h1 className="text-2xl font-bold text-white mb-4">
              Crie sua sala de estudos
            </h1>
            <p className="text-gray-200 mb-6">
              Insira seu nome para gerar o link da sua sala.
            </p>
            <input
              type="text"
              placeholder="Seu nome..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 rounded-md border border-gray-400 bg-white/20 text-white placeholder-gray-300 mb-4"
            />
            <button
              onClick={handleCreateRoom}
              className="bg-green-500 hover:bg-green-600 transition text-white font-semibold px-4 py-2 rounded-lg w-full"
            >
              Criar Sala
            </button>
          </div>
        </>
      )}
    </main>
  );
}
