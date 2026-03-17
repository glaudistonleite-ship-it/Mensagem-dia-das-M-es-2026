import { GoogleGenAI } from "@google/genai";

export const generateMessage = async (prompt: string) => {
  const apiKey = process.env.GEMINI_API_KEY || "";
  
  if (!apiKey) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      systemInstruction: "Você é um assistente carinhoso. Crie uma mensagem curta de Dia das Mães em português.",
    },
  });

  return response.text;
};

export const generateCaricature = async (base64Image: string, mimeType: string) => {
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  
  const ai = new GoogleGenAI({ apiKey });
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
          text: "Crie uma versão artística e estilizada desta pessoa para o Dia das Mães. A imagem deve ser altamente fiel aos traços reais do rosto, mantendo a semelhança física evidente, mas com um acabamento de pintura digital vibrante, elegante e festivo. Não exagere nas proporções como em caricaturas tradicionais; foque em um retrato artístico que celebre a beleza da pessoa. IMPORTANTE: Qualquer texto na imagem deve estar em português (ex: 'Feliz Dia das Mães').",
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
