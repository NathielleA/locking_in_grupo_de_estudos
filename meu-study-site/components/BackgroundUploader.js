import React, { useState } from 'react';

export default function BackgroundUploader({ onBackgroundChange }) {
    const [uploading, setUploading] = useState(false);

    // Imagens padrão (coloque-as na pasta /public/backgrounds/)
    const defaultImages = [
        '/backgrounds/pixel-art-1.png',
        '/backgrounds/pixel-art-2.png',
        '/backgrounds/pixel-art-3.png',
    ];

    const handleUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`/api/upload-background?filename=${file.name}`, {
                method: 'POST',
                body: formData,
            });

            const newBlob = await response.json();

            // 'newBlob.url' é a URL pública da imagem
            onBackgroundChange(newBlob.url);

        } catch (error) {
            console.error('Erro no upload:', error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <h4>Mudar Fundo da Sala</h4>
            <div>
                {defaultImages.map(imgSrc => (
                    <img
                        key={imgSrc}
                        src={imgSrc}
                        alt="Fundo padrão"
                        onClick={() => onBackgroundChange(imgSrc)}
                        style={{ width: '100px', cursor: 'pointer', margin: '5px' }}
                    />
                ))}
            </div>
            <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
            {uploading && <p>Enviando...</p>}
        </div>
    );
}