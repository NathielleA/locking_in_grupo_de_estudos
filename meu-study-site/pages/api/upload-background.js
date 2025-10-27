// pages/api/upload-background.js
import { put } from '@vercel/blob';

export const config = {
    api: {
        bodyParser: false, // Desabilitar o parser padrão para stream de arquivos
    },
};

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    // O 'filename' deve ser passado via query param, ex: /api/upload-background?filename=meu-fundo.png
    const filename = request.query.filename || 'background.png';

    try {
        const blob = await put(filename, request.body, {
            access: 'public', // Torna o arquivo publicamente acessível
        });

        // Retorna a URL pública do arquivo
        return response.status(200).json(blob);
    } catch (error) {
        return response.status(500).json({ error: error.message });
    }
}