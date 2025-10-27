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

    const filename = request.query.filename || 'background.png';

    try {
        // Envia o stream do request diretamente para o blob
        const blob = await put(filename, request, {
            access: 'public',
        });
        return response.status(200).json(blob);
    } catch (error) {
        return response.status(500).json({ error: error.message });
    }
}