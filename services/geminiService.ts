import { GoogleGenAI, Type } from "@google/genai";
import type { FinalReview } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const reviewSchema = {
  type: Type.OBJECT,
  properties: {
    feedback: {
      type: Type.OBJECT,
      properties: {
        abntCompliance: { type: Type.STRING, description: "Análise da conformidade ABNT (margens, espaçamento, citações). Aponte erros específicos." },
        originality: { type: Type.STRING, description: "Análise de originalidade e plágio. Indique trechos que precisam de citação ou paráfrase." },
        cohesion: { type: Type.STRING, description: "Análise de coerência e coesão. Aponte problemas de fluxo lógico e repetições." },
        grammar: { type: Type.STRING, description: "Análise ortográfica e gramatical avançada." }
      },
       required: ["abntCompliance", "originality", "cohesion", "grammar"]
    },
    suggestions: {
      type: Type.OBJECT,
      properties: {
        clarity: { type: Type.STRING, description: "Sugestão sobre a clareza do objetivo geral e sua conexão com a conclusão." },
        depth: { type: Type.STRING, description: "Sugestão sobre a profundidade do referencial teórico." },
        conclusion: { type: Type.STRING, description: "Sugestão para fortalecer as conclusões, contribuições e trabalhos futuros." },
        resultsPresentation: { type: Type.STRING, description: "Sugestão sobre a apresentação e discussão dos resultados e figuras." }
      },
      required: ["clarity", "depth", "conclusion", "resultsPresentation"]
    }
  },
  required: ["feedback", "suggestions"]
};

export const conductFinalReview = async (fullText: string): Promise<FinalReview | null> => {
    try {
        const prompt = `Aja como um Mestre de Bancada Acadêmica, um avaliador de TCC extremamente crítico e detalhista. Analise o seguinte trabalho acadêmico e forneça um feedback estruturado.

        Texto do Trabalho:
        ---
        ${fullText}
        ---

        Sua análise deve ser dividida em duas partes: 'Identificação de Erros (Crítica Fria)' e 'Sugestões de Melhoria (Conselho de Mestre)'. Responda estritamente no formato JSON solicitado.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: reviewSchema
            }
        });

        const jsonStr = response.text.trim();
        const jsonResponse = JSON.parse(jsonStr);
        return jsonResponse as FinalReview;
    } catch (e) {
        console.error("Failed to conduct final review or parse JSON:", e);
        return null;
    }
};


export const generateText = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return response.text;
    } catch (error) {
        console.error("Error generating text:", error);
        return "Desculpe, não foi possível gerar o texto no momento.";
    }
};

export const generateImage = async (prompt: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: '1:1',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            return response.generatedImages[0].image.imageBytes;
        }
        return null;

    } catch (error) {
        console.error("Error generating image:", error);
        return null;
    }
};