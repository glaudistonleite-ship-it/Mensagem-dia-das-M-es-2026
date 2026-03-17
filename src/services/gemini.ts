import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const generateMessage = async (prompt: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: "Você é um assistente poético e carinhoso especializado em mensagens de Dia das Mães. Crie mensagens emocionantes, curtas e bonitas em português.",
    },
  });
  return response.text;
};

export const generateCaricature = async (base64Image: string, mimeType: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        {
          text: "Transforme esta pessoa em uma caricatura artística, colorida e alegre para o Dia das Mães. Mantenha as características principais mas dê um toque de desenho animado elegante e festivo. IMPORTANTE: Se houver qualquer texto escrito na imagem (como 'Feliz Dia das Mães'), ele DEVE estar obrigatoriamente em português.",
        },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Não foi possível gerar a caricatura.");
};
