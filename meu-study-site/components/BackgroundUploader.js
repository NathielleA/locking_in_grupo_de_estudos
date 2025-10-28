"use client";

import React, { useRef, useState } from "react";
import { Check, UploadCloud } from "lucide-react";

export default function BackgroundUploader({ onBackgroundChange }) {
    const [uploading, setUploading] = useState(false);
    const [selected, setSelected] = useState("/backgrounds/pixel-art-1.png");
    const [isDragging, setIsDragging] = useState(false);
    const [uploadedName, setUploadedName] = useState("");
    const inputRef = useRef(null);

    const defaultImages = [
        "/backgrounds/pixel-art-1.png",
        "/backgrounds/pixel-art-2.png",
        "/backgrounds/pixel-art-3.png",
    ];

    const pickDefault = (src) => {
        setSelected(src);
        onBackgroundChange(src);
    };

    const handleFile = async (file) => {
        if (!file) return;
        setUploading(true);
        setUploadedName(file.name);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch(`/api/upload-background?filename=${file.name}`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Upload falhou");

            const newBlob = await response.json();
            // espera-se newBlob.url como retorno público
            if (newBlob?.url) {
                setSelected(newBlob.url);
                onBackgroundChange(newBlob.url);
            } else {
                console.warn("Resposta de upload sem URL:", newBlob);
            }
        } catch (err) {
            console.error("Erro no upload:", err);
            // opcional: toast ou mensagem visual aqui
        } finally {
            setUploading(false);
            setIsDragging(false);
        }
    };

    const handleUpload = (e) => {
        const file = e.target.files?.[0];
        handleFile(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        handleFile(file);
    };

    const openFilePicker = () => {
        inputRef.current?.click();
    };

    return (
        <div className="max-w-md mx-auto bg-white/8 backdrop-blur-md rounded-2xl p-5 shadow-lg text-white">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold">🖼️ Mudar Fundo da Sala</h4>
                <p className="text-sm text-gray-300">Escolha uma imagem</p>
            </div>

            {/* Default images */}
            <div className="flex gap-3 mb-4">
                {defaultImages.map((src) => {
                    const isActive = selected === src;
                    return (
                        <button
                            key={src}
                            onClick={() => pickDefault(src)}
                            className={`relative rounded-lg overflow-hidden ring-2 transition-all transform ${isActive
                                ? "ring-green-400 scale-105 shadow-lg"
                                : "ring-transparent hover:scale-102"
                                }`}
                            aria-pressed={isActive}
                            title={isActive ? "Fundo selecionado" : "Selecionar fundo"}
                            style={{ width: 100, height: 60 }}
                        >
                            <img
                                src={src}
                                alt="Fundo padrão"
                                className="object-cover w-full h-full"
                                draggable={false}
                            />

                            {/* destaque selecionado */}
                            {isActive && (
                                <div className="absolute inset-0 bg-black/25 flex items-start justify-end p-1">
                                    <span className="bg-green-500/90 text-white rounded-full p-1 shadow">
                                        <Check className="w-4 h-4" />
                                    </span>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Upload area */}
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                }}
                onDragEnter={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                }}
                onDrop={handleDrop}
                className={`w-full border-2 rounded-lg p-4 flex items-center gap-4 justify-between transition ${isDragging
                    ? "border-dashed border-green-300 bg-white/6"
                    : "border-transparent bg-white/4"
                    }`}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/6 rounded-md">
                        <UploadCloud className="w-6 h-6 text-white" />
                    </div>

                    <div>
                        <p className="text-sm">
                            Arraste e solte uma imagem aqui ou{" "}
                            <button
                                type="button"
                                onClick={openFilePicker}
                                className="text-green-300 font-medium underline"
                            >
                                escolha um arquivo
                            </button>
                        </p>
                        <p className="text-xs text-gray-300">
                            PNG, JPG, WebP — recomendado 1920×1080
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUpload}
                        disabled={uploading}
                    />

                    <button
                        onClick={openFilePicker}
                        disabled={uploading}
                        className={`px-3 py-2 rounded-lg font-medium transition ${uploading ? "bg-gray-500/60" : "bg-green-500 hover:bg-green-600"
                            }`}
                    >
                        {uploading ? (
                            <span className="flex items-center gap-2">
                                <svg
                                    className="animate-spin h-4 w-4"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                    ></path>
                                </svg>
                                Enviando...
                            </span>
                        ) : (
                            "Enviar"
                        )}
                    </button>
                </div>
            </div>

            {/* Info adicional */}
            <div className="mt-3 text-sm text-gray-300 flex items-center justify-between">
                <span>
                    Selecionado:{" "}
                    <strong className="text-white">
                        {selected.includes("/backgrounds/") ? "Padrão" : uploadedName || "Personalizado"}
                    </strong>
                </span>

                {uploadedName && (
                    <button
                        onClick={() => {
                            // limpar arquivo enviado (não remove do server, apenas do estado)
                            setUploadedName("");
                        }}
                        className="text-xs text-gray-300 underline"
                    >
                        Limpar nome
                    </button>
                )}
            </div>
        </div>
    );
}
