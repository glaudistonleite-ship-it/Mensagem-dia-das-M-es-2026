import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Camera, Send, Sparkles, Image as ImageIcon, Loader2, Download, RefreshCw, Share2, Copy, Check } from 'lucide-react';
import { generateMessage, generateCaricature } from './services/gemini';

const PRESET_MESSAGES = [
  "Mãe, seu amor é o jardim onde minha vida floresce. Feliz Dia das Mães!",
  "Para o mundo você é uma mãe, para mim você é o mundo.",
  "Obrigado por ser meu porto seguro e minha maior inspiração. Te amo!",
  "Mãe: a palavra mais bonita que o coração pode pronunciar.",
  "Seu abraço é o único lugar onde o tempo para e tudo fica bem.",
  "Nenhuma língua é capaz de expressar a beleza e a força de uma mãe.",
  "Mãe, você é a minha primeira amiga, minha melhor amiga e minha amiga para sempre.",
  "Tudo o que sou, ou pretendo ser, devo à minha mãe.",
  "O amor de mãe é o combustível que permite a um ser humano comum fazer o impossível.",
  "Mãe, seu coração é um abismo profundo em cujo fundo sempre encontrarei o perdão.",
  "A vida não vem com manual, vem com uma mãe.",
  "Mãe é flor que rega a vida com amor e paciência.",
  "Obrigado por me ensinar que o amor não tem limites.",
  "Você é a luz que ilumina meus dias mais escuros. Feliz seu dia!",
  "Mãe, sua força é o que me mantém de pé. Obrigado por tudo.",
  "Não existem palavras suficientes para agradecer por todo o seu sacrifício.",
  "Você é a rainha do meu coração e a heroína da minha história.",
  "Mãe, seu sorriso é o meu maior tesouro.",
  "Obrigado por acreditar em mim mesmo quando eu não acreditava.",
  "Ser mãe é descobrir que o coração é um lugar infinito.",
  "Mãe, você é a prova viva de que anjos existem na Terra.",
  "Seu amor é a âncora que me mantém firme em qualquer tempestade.",
  "Obrigado por ser minha bússola e meu exemplo de bondade.",
  "Mãe, você é a melodia mais doce da minha vida.",
  "Feliz Dia das Mães para aquela que me deu a vida e me ensinou a vivê-la!"
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'messages' | 'caricature'>('messages');
  const [customMessage, setCustomMessage] = useState('');
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [caricatureResult, setCaricatureResult] = useState<string | null>(null);
  const [isGeneratingCaricature, setIsGeneratingCaricature] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [customCopied, setCustomCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleShare = async (text: string, index?: number, isCustom?: boolean) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mensagem de Dia das Mães',
          text: text,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Erro ao compartilhar:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(text);
        if (isCustom) {
          setCustomCopied(true);
          setTimeout(() => setCustomCopied(false), 2000);
        } else if (index !== undefined) {
          setCopiedIndex(index);
          setTimeout(() => setCopiedIndex(null), 2000);
        }
      } catch (err) {
        console.error('Erro ao copiar:', err);
      }
    }
  };

  const handleGenerateCustomMessage = async () => {
    setIsGeneratingMessage(true);
    
    // Fallback messages in case of API failure
    const fallbacks = [
      "Mãe, seu amor é o presente mais bonito que a vida me deu. Te amo!",
      "Para a rainha do meu coração: um Feliz Dia das Mães cheio de luz!",
      "Obrigado por ser meu exemplo de força e ternura. Você é única!",
      "Mãe, você é a prova de que anjos existem. Feliz seu dia!"
    ];
    const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];

    // Create a timeout to prevent infinite loading
    const timeout = new Promise<string>((_, reject) => 
      setTimeout(() => reject(new Error("Timeout")), 12000)
    );

    try {
      const generatePromise = generateMessage("Crie uma mensagem curta e emocionante de Dia das Mães.");
      const msg = await Promise.race([generatePromise, timeout]);
      setCustomMessage(msg || randomFallback);
    } catch (error) {
      console.error("Erro ao gerar mensagem:", error);
      setCustomMessage(randomFallback);
    } finally {
      setIsGeneratingMessage(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setCaricatureResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateCaricature = async () => {
    if (!selectedImage) return;
    setIsGeneratingCaricature(true);
    try {
      const base64Data = selectedImage.split(',')[1];
      const mimeType = selectedImage.split(';')[0].split(':')[1];
      const result = await generateCaricature(base64Data, mimeType);
      setCaricatureResult(result);
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar caricatura. Tente novamente.");
    } finally {
      setIsGeneratingCaricature(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdf8f6] pb-12">
      {/* Hero Section */}
      <header className="relative h-[40vh] flex items-center justify-center overflow-hidden bg-[#fce7e1]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center z-10 px-8 py-10 bg-white/40 backdrop-blur-md rounded-3xl border border-white/30 shadow-2xl mx-4 max-w-2xl"
        >
          <h1 className="serif text-5xl md:text-7xl text-[#5d3a3a] mb-4 drop-shadow-sm font-bold">Mãe Maravilha</h1>
          <p className="text-[#6d4c4c] text-xl md:text-2xl italic serif font-medium">Celebrando o amor mais puro do mundo</p>
        </motion.div>
        <div className="absolute inset-0 opacity-40">
          <img 
            src="https://images.unsplash.com/photo-1510154221590-ff63e90a136f?q=80&w=1200&auto=format&fit=crop" 
            alt="Mãe sendo abraçada pelos filhos" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </header>

      {/* Navigation */}
      <nav className="max-w-md mx-auto mt-8 px-4">
        <div className="flex bg-white rounded-full p-1 shadow-sm border border-[#f5e1da]">
          <button 
            onClick={() => setActiveTab('messages')}
            className={`flex-1 py-3 rounded-full text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'messages' ? 'bg-[#f5e1da] text-[#8b5e5e]' : 'text-[#a67c7c] hover:bg-gray-50'}`}
          >
            <Heart size={18} /> Mensagens
          </button>
          <button 
            onClick={() => setActiveTab('caricature')}
            className={`flex-1 py-3 rounded-full text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'caricature' ? 'bg-[#f5e1da] text-[#8b5e5e]' : 'text-[#a67c7c] hover:bg-gray-50'}`}
          >
            <Camera size={18} /> Caricatura
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto mt-12 px-4">
        <AnimatePresence mode="wait">
          {activeTab === 'messages' ? (
            <motion.div 
              key="messages"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <section>
                <h2 className="serif text-3xl text-[#8b5e5e] mb-6 text-center">Inspirações</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {PRESET_MESSAGES.map((msg, i) => (
                    <motion.div 
                      key={i}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => handleShare(msg, i)}
                      className="bg-white p-8 rounded-2xl shadow-sm border border-[#f5e1da] relative overflow-hidden group cursor-pointer"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity flex gap-2">
                        {copiedIndex === i ? (
                          <Check size={20} className="text-green-500" />
                        ) : (
                          <Share2 size={20} className="text-[#8b5e5e]" />
                        )}
                      </div>
                      <p className="serif text-xl italic text-[#6d4c4c] leading-relaxed">"{msg}"</p>
                      <div className="mt-4 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] uppercase tracking-widest text-[#a67c7c] font-bold">Clique para compartilhar</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>

              <section className="bg-[#fce7e1] p-8 rounded-3xl text-center">
                <Sparkles className="mx-auto mb-4 text-[#8b5e5e]" size={32} />
                <h3 className="serif text-2xl text-[#8b5e5e] mb-4">Crie uma mensagem única</h3>
                <p className="text-[#a67c7c] mb-6">Deixe a inteligência artificial ajudar você a expressar seu amor.</p>
                <button 
                  onClick={handleGenerateCustomMessage}
                  disabled={isGeneratingMessage}
                  className="bg-[#8b5e5e] text-white px-8 py-3 rounded-full font-medium hover:bg-[#7a5252] transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                >
                  {isGeneratingMessage ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
                  Gerar Mensagem
                </button>

                {customMessage && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => handleShare(customMessage, undefined, true)}
                    className="mt-8 bg-white p-8 rounded-2xl shadow-md border-2 border-[#8b5e5e]/10 cursor-pointer group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                      {customCopied ? (
                        <Check size={24} className="text-green-500" />
                      ) : (
                        <Share2 size={24} className="text-[#8b5e5e]" />
                      )}
                    </div>
                    <p className="serif text-2xl italic text-[#4a3a3a]">{customMessage}</p>
                    <div className="mt-4 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] uppercase tracking-widest text-[#a67c7c] font-bold">Clique para compartilhar</span>
                    </div>
                  </motion.div>
                )}
              </section>
            </motion.div>
          ) : (
            <motion.div 
              key="caricature"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#f5e1da] text-center">
                <h2 className="serif text-3xl text-[#8b5e5e] mb-2">Transforme uma Foto</h2>
                <p className="text-[#a67c7c] mb-8">Envie uma foto da sua mãe e crie uma caricatura artística exclusiva.</p>

                <div className="flex flex-col items-center gap-6">
                  {!selectedImage ? (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full aspect-square max-w-sm border-2 border-dashed border-[#f5e1da] rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-[#fffaf9] transition-colors group"
                    >
                      <ImageIcon size={48} className="text-[#f5e1da] group-hover:text-[#8b5e5e] transition-colors mb-4" />
                      <span className="text-[#a67c7c] font-medium">Clique para selecionar foto</span>
                    </div>
                  ) : (
                    <div className="w-full space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="text-xs uppercase tracking-widest text-[#a67c7c]">Original</p>
                          <img src={selectedImage} alt="Original" className="w-full aspect-square object-cover rounded-2xl shadow-sm" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs uppercase tracking-widest text-[#a67c7c]">Caricatura</p>
                          <div className="w-full aspect-square bg-[#fdf8f6] rounded-2xl border border-[#f5e1da] flex items-center justify-center overflow-hidden">
                            {isGeneratingCaricature ? (
                              <div className="text-center">
                                <Loader2 className="animate-spin mx-auto text-[#8b5e5e] mb-2" size={32} />
                                <p className="text-sm text-[#a67c7c]">Criando arte...</p>
                              </div>
                            ) : caricatureResult ? (
                              <img src={caricatureResult} alt="Caricatura" className="w-full h-full object-cover" />
                            ) : (
                              <Sparkles size={32} className="text-[#f5e1da]" />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap justify-center gap-4">
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="px-6 py-2 border border-[#8b5e5e] text-[#8b5e5e] rounded-full text-sm font-medium hover:bg-[#fdf8f6]"
                        >
                          Trocar Foto
                        </button>
                        {!caricatureResult && (
                          <button 
                            onClick={handleCreateCaricature}
                            disabled={isGeneratingCaricature}
                            className="px-8 py-2 bg-[#8b5e5e] text-white rounded-full text-sm font-medium hover:bg-[#7a5252] disabled:opacity-50 flex items-center gap-2"
                          >
                            <Sparkles size={16} /> Gerar Caricatura
                          </button>
                        )}
                        {caricatureResult && (
                          <a 
                            href={caricatureResult} 
                            download="caricatura-mae.png"
                            className="px-8 py-2 bg-[#8b5e5e] text-white rounded-full text-sm font-medium hover:bg-[#7a5252] flex items-center gap-2"
                          >
                            <Download size={16} /> Baixar Arte
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Ad Banner Placeholder */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <div className="bg-gray-100 border border-dashed border-gray-300 rounded-xl p-4 text-center">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Publicidade</p>
          <div className="h-12 flex items-center justify-center text-gray-400 italic text-sm">
            Espaço reservado para o Banner do AdMob
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center px-4">
        <div className="w-12 h-1 bg-[#f5e1da] mx-auto mb-6 rounded-full" />
        <p className="serif italic text-[#a67c7c]">Feito com carinho para todas as mães</p>
      </footer>
    </div>
  );
}
