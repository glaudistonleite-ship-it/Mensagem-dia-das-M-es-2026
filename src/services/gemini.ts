import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const getApiKey = () => {
  const key = process.env.GEMINI_API_KEY || "";
  if (!key) {
    console.warn("GEMINI_API_KEY não encontrada no ambiente.");
  }
  return key;
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const callWithRetry = async (fn: () => Promise<any>, maxRetries = 2) => {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMsg = error.message || JSON.stringify(error);
      // Se for erro de quota (429), tenta novamente com backoff exponencial curto
      if (errorMsg.includes("429") || error.status === "RESOURCE_EXHAUSTED" || errorMsg.includes("quota")) {
        if (i === maxRetries - 1) break; // Não espera na última tentativa
        const waitTime = Math.pow(2, i) * 1500 + Math.random() * 500;
        console.warn(`Quota excedida. Tentando novamente em ${Math.round(waitTime)}ms... (Tentativa ${i + 1}/${maxRetries})`);
        await delay(waitTime);
        continue;
      }
      // Outros erros não retentamos para não travar o app
      throw error;
    }
  }
  
  if (lastError?.message?.includes("429") || JSON.stringify(lastError).includes("429") || lastError?.status === "RESOURCE_EXHAUSTED") {
    throw new Error("O limite de uso gratuito foi atingido. Por favor, aguarde 60 segundos e tente novamente.");
  }
  throw lastError;
};

export const generateMessage = async (prompt: string) => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error("Chave de API não configurada. Por favor, verifique as configurações.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  return await callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "Você é um assistente carinhoso e poético. Crie mensagens de Dia das Mães em português do Brasil que sejam tocantes e originais.",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      },
    });
    return response.text;
  });
};

export const generateCaricature = async (base64Image: string, mimeType: string) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Chave de API não configurada.");
  }
  
  const ai = new GoogleGenAI({ apiKey });
  
  return await callWithRetry(async () => {
    console.log("Iniciando geração de caricatura com o modelo gemini-2.5-flash-image...");
    
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
            text: "Crie uma caricatura artística e fofa desta pessoa (estilo cartoon moderno Disney/Pixar). IMPORTANTE: Mantenha fielmente os traços faciais e a semelhança com a foto original para que a pessoa seja facilmente reconhecível. Use cores vibrantes, traços suaves e um acabamento profissional. O resultado deve ser uma ilustração amorosa e festiva para o Dia das Mães. Se houver qualquer texto na imagem, ele DEVE estar obrigatoriamente em Português do Brasil (ex: 'Feliz Dia das Mães'). Não use nenhum texto em inglês.",
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        }
      }
    });

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("O modelo não retornou nenhum resultado.");
    }

    const candidate = response.candidates[0];
    if (!candidate.content || !candidate.content.parts) {
      throw new Error("Resposta do modelo malformada.");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    
    const textPart = candidate.content.parts.find(p => p.text);
    if (textPart) {
      throw new Error(`O modelo não conseguiu gerar a imagem. Motivo: ${textPart.text}`);
    }

    throw new Error("Nenhuma imagem encontrada na resposta do modelo.");
  });
};

export const generateThemedBackground = async () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Chave de API não configurada.");
  }
  
  const ai = new GoogleGenAI({ apiKey });
  
  return await callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            text: `Crie uma imagem artística e emocionante para o Dia das Mães. A imagem deve ser uma ilustração digital de alta qualidade, com cores suaves e acolhedoras, representando o amor materno (ex: flores delicadas, abraços simbólicos, corações artísticos). IMPORTANTE: NÃO escreva nenhum texto na imagem. A imagem deve ser limpa para servir de fundo para uma mensagem.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "4:3",
        }
      }
    });

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("Nenhum resultado gerado.");
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("Imagem de fundo não encontrada.");
  });
};
