"use client";

import React, { useState, useRef } from 'react';

export default function MusicPlayer() {
    const [trackUrl, setTrackUrl] = useState(null);
    const audioRef = useRef(null);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Cria uma URL local para o arquivo no navegador
            setTrackUrl(URL.createObjectURL(file));
        }
    };

    return (
        <div>
            <h4>Música de Fundo (Local)</h4>
            <input type="file" accept="audio/*" onChange={handleFileChange} />
            {trackUrl && (
                <audio ref={audioRef} src={trackUrl} controls loop>
                    Seu navegador não suporta o elemento de áudio.
                </audio>
            )}
        </div>
    );
}