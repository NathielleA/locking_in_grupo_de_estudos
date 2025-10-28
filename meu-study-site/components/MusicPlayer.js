"use client";

import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, Music, X } from "lucide-react";

export default function MusicPlayer() {
    const audioRef = useRef(null);

    // exemplo de músicas por estilo (substitua pelas suas URLs em /public/tracks/)
    const genres = {
        Chill: [
            { name: "Chill Breeze", url: "/tracks/chill-1.mp3" },
            { name: "Night Study", url: "/tracks/chill-2.mp3" },
        ],
        Focus: [
            { name: "Deep Focus", url: "/tracks/focus-1.mp3" },
            { name: "Concentration Loop", url: "/tracks/focus-2.mp3" },
        ],
        Classical: [
            { name: "Piano Study", url: "/tracks/classic-1.mp3" },
            { name: "Soft Strings", url: "/tracks/classic-2.mp3" },
        ],
    };

    const [currentTrack, setCurrentTrack] = useState(null); // {name, url}
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0); // 0..100
    const [showPicker, setShowPicker] = useState(false);
    const [selectedGenre, setSelectedGenre] = useState(null);
    const [uploadingName, setUploadingName] = useState("");

    // Atualiza a barra de progresso
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            if (!audio.duration || isNaN(audio.duration)) return;
            setProgress((audio.currentTime / audio.duration) * 100);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setProgress(0);
            // se quiser autoplay de próxima faixa, implemente aqui
        };

        audio.addEventListener("timeupdate", handleTimeUpdate);
        audio.addEventListener("ended", handleEnded);

        return () => {
            audio.removeEventListener("timeupdate", handleTimeUpdate);
            audio.removeEventListener("ended", handleEnded);
        };
    }, [currentTrack]);

    // play / pause effect
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying) {
            audio.play().catch((e) => {
                // autoplay bloqueado, parar o play
                console.warn("Play falhou:", e);
                setIsPlaying(false);
            });
        } else {
            audio.pause();
        }
    }, [isPlaying, currentTrack]);

    const togglePlay = () => {
        if (!currentTrack) return;
        setIsPlaying((p) => !p);
    };

    const selectTrack = (track) => {
        setCurrentTrack(track);
        setIsPlaying(true);
        setShowPicker(false);
        setSelectedGenre(null);
        setProgress(0);
        setUploadingName("");
    };

    // upload local
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setCurrentTrack({ name: file.name, url });
        setIsPlaying(true);
        setUploadingName(file.name);
        setShowPicker(false);
        setSelectedGenre(null);
        setProgress(0);
    };

    // seek ao clicar na barra
    const seek = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const pct = clickX / rect.width;
        const audio = audioRef.current;
        if (audio && audio.duration) {
            audio.currentTime = pct * audio.duration;
            setProgress(pct * 100);
        }
    };

    return (
        <div className="max-w-sm mx-auto bg-white/10 backdrop-blur-md rounded-2xl p-4 shadow-lg text-white">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold flex items-center gap-2">
                    <Music className="w-5 h-5" /> Música de Fundo
                </h4>

                <button
                    onClick={() => setShowPicker((s) => !s)}
                    className="text-sm text-green-300 underline"
                >
                    Selecionar música
                </button>
            </div>

            {/* Exibição da faixa atual */}
            <div className="mb-3">
                <div className="text-sm text-gray-300">Tocando agora</div>
                <div className="mt-1 text-white font-medium">
                    {currentTrack ? currentTrack.name : "Nenhuma faixa selecionada"}
                </div>
            </div>

            {/* Controles */}
            <div className="flex items-center gap-3">
                <button
                    onClick={togglePlay}
                    disabled={!currentTrack}
                    className={`p-3 rounded-lg transition ${currentTrack
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-gray-600/40 cursor-not-allowed"
                        }`}
                    aria-pressed={isPlaying}
                    title={isPlaying ? "Pausar" : "Tocar"}
                >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>

                <div className="flex-1">
                    <div
                        className="w-full h-2 bg-gray-300/20 rounded-full cursor-pointer"
                        onClick={seek}
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(progress)}
                    >
                        <div
                            className="h-full bg-green-400 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-gray-300 mt-1">
                        <span>{currentTrack ? "00:00" : ""}</span>
                        <span>{currentTrack ? "" : ""}</span>
                    </div>
                </div>
            </div>

            {/* Upload local */}
            <div className="mt-4 flex items-center justify-between gap-3">
                <label
                    className="flex-1 px-3 py-2 rounded-lg bg-white/6 text-sm cursor-pointer text-center hover:bg-white/8"
                    title="Fazer upload de um arquivo de áudio local"
                >
                    <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={handleFileChange}
                        aria-label="upload-audio"
                    />
                    {uploadingName ? `Arquivo: ${uploadingName}` : "Upload local (MP3, WAV)"}
                </label>

                <button
                    onClick={() => {
                        setCurrentTrack(null);
                        setIsPlaying(false);
                        setProgress(0);
                        setUploadingName("");
                    }}
                    className="px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm"
                >
                    Limpar
                </button>
            </div>

            {/* Modal / painel seletor de gêneros e faixas */}
            {showPicker && (
                <div className="mt-4 bg-white/6 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                        <strong>Escolha um estilo</strong>
                        <button
                            onClick={() => {
                                setShowPicker(false);
                                setSelectedGenre(null);
                            }}
                            className="p-1 rounded-md hover:bg-white/8"
                            aria-label="fechar-seletor"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Lista de gêneros */}
                    <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                        {Object.keys(genres).map((g) => (
                            <button
                                key={g}
                                onClick={() => setSelectedGenre(g)}
                                className={`px-3 py-1 rounded-full text-sm transition ${selectedGenre === g
                                    ? "bg-green-500 text-white"
                                    : "bg-white/8 text-white"
                                    }`}
                            >
                                {g}
                            </button>
                        ))}
                    </div>

                    {/* Lista de faixas do gênero selecionado */}
                    <div>
                        {!selectedGenre && (
                            <div className="text-sm text-gray-300">Selecione um estilo acima.</div>
                        )}

                        {selectedGenre && (
                            <ul className="space-y-2 max-h-40 overflow-auto">
                                {genres[selectedGenre].map((t) => (
                                    <li
                                        key={t.url}
                                        className="flex items-center justify-between p-2 rounded-md hover:bg-white/8 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white/6 rounded-md flex items-center justify-center text-sm">
                                                ▶
                                            </div>
                                            <div>
                                                <div className="font-medium">{t.name}</div>
                                                <div className="text-xs text-gray-300">{selectedGenre}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => selectTrack(t)}
                                                className="px-2 py-1 rounded-md bg-green-500 hover:bg-green-600 text-white text-sm"
                                            >
                                                Selecionar
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {/* Elemento <audio> invisível que reproduz a faixa */}
            {currentTrack && (
                <audio
                    ref={audioRef}
                    src={currentTrack.url}
                    preload="auto"
                    loop
                    style={{ display: "none" }}
                />
            )}
        </div>
    );
}
