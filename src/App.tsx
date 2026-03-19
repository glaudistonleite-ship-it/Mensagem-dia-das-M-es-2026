import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Send, Sparkles, Image as ImageIcon, Loader2, Download, RefreshCw, Share2, Check } from 'lucide-react';
import { generateMessage, generateCaricature } from './services/gemini';


type Category = 'curtas' | 'emocionantes' | 'religiosas' | 'engracadas' | 'status' | 'motivacionais' | 'especiais';

const CATEGORIES: { id: Category; label: string; icon: string; prompt: string }[] = [
  { id: 'curtas', label: 'Mensagens Curtas', icon: '💖', prompt: 'Crie uma mensagem curtíssima de Dia das Mães (máximo 10 palavras).' },
  { id: 'emocionantes', label: 'Emocionantes', icon: '😢', prompt: 'Crie uma mensagem de Dia das Mães PROFUNDAMENTE EMOCIONANTE, longa e tocante, capaz de fazer chorar de emoção. Use palavras que toquem a alma, fale sobre sacrifício, amor incondicional e a importância vital de uma mãe. A mensagem deve ser extensa e poética.' },
  { id: 'religiosas', label: 'Religiosas', icon: '🙏', prompt: 'Crie uma mensagem religiosa de Dia das Mães com bênçãos e fé.' },
  { id: 'engracadas', label: 'Engraçadas', icon: '😂', prompt: 'Crie uma mensagem engraçada e divertida de Dia das Mães.' },
  { id: 'status', label: 'Status para WhatsApp', icon: '📱', prompt: 'Crie uma frase curta e impactante de Dia das Mães ideal para status de WhatsApp.' },
  { id: 'motivacionais', label: 'Motivacionais', icon: '✨', prompt: 'Crie uma mensagem de Dia das Mães motivadora e inspiradora. Fale sobre a força da mulher, a resiliência de ser mãe e como ela é um exemplo de superação e luz para seus filhos.' },
  { id: 'especiais', label: 'Mensagens Especiais 💌', icon: '💎', prompt: 'Crie uma mensagem de Dia das Mães EXTRAORDINÁRIA, LUXUOSA e EXTREMAMENTE TOCANTE. Deve ser uma obra-prima em forma de texto, longa, com metáforas lindas e um sentimento de gratidão infinita que leve às lágrimas.' },
];

export default function App() {
  const [activeCategory, setActiveCategory] = useState<Category>('curtas');
  const [customMessage, setCustomMessage] = useState('');
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [caricatureResult, setCaricatureResult] = useState<string | null>(null);
  const [isGeneratingCaricature, setIsGeneratingCaricature] = useState(false);
  const [customCopied, setCustomCopied] = useState(false);
  const [isPremiumUnlocked, setIsPremiumUnlocked] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);
  const [actionCount, setActionCount] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [motherName, setMotherName] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadingMessages = [
    "Otimizando sua foto...",
    "Analisando os traços do rosto...",
    "Desenhando o esboço artístico...",
    "Aplicando cores vibrantes...",
    "Estilizando no padrão Disney/Pixar...",
    "Finalizando os detalhes mágicos...",
    "Quase pronto! ❤️"
  ];

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGeneratingCaricature) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % loadingMessages.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isGeneratingCaricature]);

  const playNotificationSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.volume = 0.5;
    audio.play().catch(e => console.log("Som bloqueado pelo navegador até interação do usuário:", e));
  };

  const resizeImage = (base64Str: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // Reduzimos qualidade para 0.7 para ser ainda mais rápido
      };
    });
  };

  React.useEffect(() => {
    handleGenerateCustomMessage('curtas');
    
    // Show a simulated notification after 5 seconds
    const timer = setTimeout(() => {
      setShowNotification(true);
      playNotificationSound();
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const incrementActions = () => {
    const newCount = actionCount + 1;
    setActionCount(newCount);
    // Show rating prompt after 3 actions
    if (newCount === 3) {
      setTimeout(() => setShowRatingPrompt(true), 1000);
    }
  };

  const handleShare = (text: string) => {
    executeShare(text);
  };

  const executeShare = async (text: string, platform?: 'whatsapp') => {
    if (platform === 'whatsapp') {
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
      incrementActions();
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mensagem de Dia das Mães',
          text: text,
        });
        incrementActions();
      } catch (err) {
        console.error('Erro ao compartilhar:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        setCustomCopied(true);
        setTimeout(() => setCustomCopied(false), 2000);
        incrementActions();
      } catch (err) {
        console.error('Erro ao copiar:', err);
      }
    }
  };

  const handleGenerateCustomMessage = async (category: Category) => {
    console.log(`Gerando mensagem para categoria: ${category}, nome: ${motherName}`);
    const cat = CATEGORIES.find(c => c.id === category);
    if (!cat) {
      console.warn("Categoria inválida para geração de mensagem:", category);
      return;
    }

    if (cat.id === 'especiais' && !isPremiumUnlocked) {
      setShowAdModal(true);
      return;
    }

    setIsGeneratingMessage(true);
    setCustomMessage('');
    
    const fallbacks: Record<string, string[]> = {
      curtas: ["Mãe, você é meu tudo! Feliz Dia das Mães!", "Te amo, mãe! Obrigado por tudo."],
      emocionantes: ["Mãe, seu amor é a luz que guia meus passos. Não sei o que seria de mim sem você.", "Obrigado por cada sacrifício, por cada lágrima e por cada sorriso. Te amo infinitamente."],
      religiosas: ["Que Deus abençoe sua vida hoje e sempre, mãe. Você é um presente divino.", "Mãe, você é a maior bênção que Deus colocou no meu caminho."],
      engracadas: ["Mãe, eu te amo mais do que você ama dizer 'na volta a gente compra'.", "Feliz Dia das Mães para aquela que sempre acha o que eu perco em 2 segundos."],
      status: ["Mãe: meu primeiro amor, minha eterna rainha. 👑❤️", "A vida não vem com manual, vem com uma mãe. Feliz Dia das Mães! 🌸"],
      especiais: ["Mãe, você é a poesia mais linda que Deus escreveu em minha vida. Seu amor é um oceano de bondade, onde encontro paz e força para enfrentar qualquer tempestade. Obrigado por ser minha rocha, meu porto seguro e minha maior inspiração. Feliz Dia das Mães!", "Neste dia tão especial, quero que saiba que cada batida do meu coração é um agradecimento por tudo o que você é. Sua dedicação, seu carinho e sua sabedoria moldaram quem eu sou hoje. Você é a rainha do meu lar e a heroína da minha história. Te amo além das palavras!"],
      motivacionais: ["Mãe, sua força é o que me ensina a nunca desistir. Você é o maior exemplo de resiliência que conheço.", "Sua luz brilha em cada passo que dou. Obrigado por ser essa mulher incrível e inspiradora."]
    };

    const categoryFallbacks = fallbacks[category] || fallbacks.curtas;
    const randomFallback = categoryFallbacks[Math.floor(Math.random() * categoryFallbacks.length)];

    const timeout = new Promise<string>((_, reject) => 
      setTimeout(() => reject(new Error("Timeout")), 30000)
    );

    try {
      const prompt = motherName 
        ? `${cat.prompt} Por favor, inclua o nome "${motherName}" na mensagem de forma natural.`
        : cat.prompt;
      const generatePromise = generateMessage(prompt);
      const msg = await Promise.race([generatePromise, timeout]);
      let finalMsg = msg || randomFallback;
      
      // Se a IA falhar em incluir o nome, tentamos uma substituição simples se houver "Mãe"
      if (motherName && !finalMsg.includes(motherName)) {
        finalMsg = finalMsg.replace(/Mãe/g, `Mãe ${motherName}`);
      }
      
      setCustomMessage(finalMsg);
      incrementActions();
    } catch (error: any) {
      console.error("Erro ao gerar mensagem:", error);
      if (error.message?.includes("limite de uso gratuito") || error.message?.includes("quota") || error.message?.includes("429")) {
        alert("O servidor de IA está um pouco ocupado no momento. Usamos uma mensagem carinhosa pré-definida para você não ficar esperando!");
      }
      setCustomMessage(randomFallback);
    } finally {
      setIsGeneratingMessage(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const resized = await resizeImage(reader.result as string);
        setSelectedImage(resized);
        setCaricatureResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateCaricature = async () => {
    if (!selectedImage) return;

    setIsGeneratingCaricature(true);
    try {
      // Já redimensionamos no upload, mas garantimos aqui também se necessário
      const base64Data = selectedImage.split(',')[1];
      const mimeType = selectedImage.split(';')[0].split(':')[1];
      const result = await generateCaricature(base64Data, mimeType);
      setCaricatureResult(result);
      incrementActions();
    } catch (error: any) {
      console.error('Erro na geração de caricatura:', error);
      alert(`Erro ao gerar caricatura: ${error.message || 'Por favor, tente novamente.'}`);
    } finally {
      setIsGeneratingCaricature(false);
    }
  };

  const handleUnlockPremium = () => {
    setShowAdModal(false);
    setIsPremiumUnlocked(true);
    handleGenerateCustomMessage('especiais');
  };

  return (
    <div className="min-h-screen bg-[#fdf8f6] pb-12">
      {/* Simulated Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div 
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-4 left-4 right-4 z-[60] md:left-auto md:right-4 md:w-80"
          >
            <div className="bg-white rounded-2xl p-4 shadow-2xl border border-[#f5e1da] flex items-start gap-4">
              <div className="bg-[#fce7e1] p-2 rounded-xl text-[#8b5e5e]">
                <Heart size={24} fill="currentColor" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#5d3a3a]">Lembrete Carinhoso ❤️</p>
                <p className="text-xs text-[#6d4c4c] mt-1">Já enviou uma mensagem para sua mãe hoje?</p>
              </div>
              <button 
                onClick={() => setShowNotification(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <RefreshCw size={16} className="rotate-45" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rating Prompt Modal */}
      <AnimatePresence>
        {showRatingPrompt && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="text-5xl mb-4">⭐</div>
              <h3 className="serif text-2xl text-[#5d3a3a] mb-2">Gostando do app?</h3>
              <p className="text-[#6d4c4c] mb-8">Sua avaliação nos ajuda a crescer e criar mais conteúdos especiais!</p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    alert("Obrigado pela avaliação! Redirecionando para a loja...");
                    setShowRatingPrompt(false);
                  }}
                  className="w-full bg-[#8b5e5e] text-white py-4 rounded-2xl font-bold hover:bg-[#7a5252] transition-all shadow-lg"
                >
                  Avaliar Agora ⭐⭐⭐⭐⭐
                </button>
                <button 
                  onClick={() => setShowRatingPrompt(false)}
                  className="text-[#a67c7c] text-sm font-medium hover:underline py-2"
                >
                  Lembrar mais tarde
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Rewarded Ad Modal Simulation */}
      <AnimatePresence>
        {showAdModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-[#fce7e1] rounded-full flex items-center justify-center mx-auto mb-6">
                <ImageIcon className="text-[#8b5e5e]" size={40} />
              </div>
              <h3 className="serif text-2xl text-[#5d3a3a] mb-2">Conteúdo Exclusivo ✨</h3>
              <p className="text-[#6d4c4c] mb-8">Assista a um vídeo curto para liberar mensagens especiais e a criação de caricaturas artísticas!</p>
              
              <button 
                onClick={handleUnlockPremium}
                className="w-full bg-[#8b5e5e] text-white py-4 rounded-2xl font-bold hover:bg-[#7a5252] transition-all shadow-lg flex items-center justify-center gap-2 mb-4"
              >
                <RefreshCw size={20} /> Assistir Anúncio
              </button>
              
              <button 
                onClick={() => setShowAdModal(false)}
                className="text-[#a67c7c] text-sm font-medium hover:underline"
              >
                Talvez depois
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Hero Section */}
      <header className="relative min-h-[40vh] flex items-center justify-center overflow-hidden bg-[#fce7e1] py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center z-10 px-6 py-10 md:px-10 md:py-12 bg-white/50 backdrop-blur-md rounded-[3rem] border border-white/40 shadow-2xl mx-4 max-w-3xl"
        >
          <h1 className="serif text-2xl sm:text-4xl md:text-6xl lg:text-7xl text-[#5d3a3a] mb-4 drop-shadow-sm font-bold leading-tight">Mensagens Dia das Mães 2026 ❤️</h1>
          <p className="text-[#6d4c4c] text-base sm:text-xl md:text-2xl italic serif font-medium">Celebrando o amor mais puro do mundo</p>
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

      {/* Navigation Categories */}
      <nav className="max-w-4xl mx-auto mt-12 px-4 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {CATEGORIES.filter(c => c.id !== 'especiais').map((cat) => (
            <button 
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveCategory(cat.id);
                handleGenerateCustomMessage(cat.id);
              }}
              className={`py-4 px-1 rounded-2xl text-xs sm:text-sm font-medium transition-all flex flex-col items-center justify-center gap-2 border shadow-sm ${activeCategory === cat.id ? 'bg-[#f5e1da] border-[#8b5e5e] text-[#8b5e5e]' : 'bg-white border-[#f5e1da] text-[#a67c7c] hover:bg-gray-50'}`}
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-center leading-tight break-words px-1">{cat.label}</span>
            </button>
          ))}
          
          {/* Premium Category Button - Full Width on Mobile, spans 3 cols on Desktop */}
          {CATEGORIES.filter(c => c.id === 'especiais').map((cat) => (
            <button 
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveCategory(cat.id);
                if (!isPremiumUnlocked) {
                  setShowAdModal(true);
                } else {
                  // Gera mensagem se não houver uma
                  if (!customMessage) {
                    handleGenerateCustomMessage(cat.id);
                  }
                }
              }}
              className={`col-span-2 md:col-span-3 py-5 px-4 rounded-2xl text-lg font-bold transition-all flex items-center justify-center gap-4 border shadow-md relative overflow-hidden group ${activeCategory === cat.id ? 'bg-[#8b5e5e] text-white border-[#8b5e5e]' : 'bg-gradient-to-r from-[#fce7e1] to-[#f5e1da] border-[#8b5e5e]/20 text-[#8b5e5e] hover:shadow-lg'}`}
            >
              {!isPremiumUnlocked && (
                <div className="absolute top-0 right-0 bg-[#8b5e5e] text-white text-[10px] px-3 py-1 rounded-bl-xl uppercase tracking-widest font-bold">Exclusivo</div>
              )}
              <span className="text-3xl group-hover:scale-110 transition-transform">{cat.icon}</span>
              <span>{cat.label}</span>
              <Sparkles className={`text-[#8b5e5e] ${activeCategory === cat.id ? 'text-white' : ''}`} size={20} />
            </button>
          ))}
        </div>

        {/* Mother's Name Input - Enhanced with Personalize Button */}
        <div className="bg-white p-4 rounded-[2rem] shadow-xl border border-[#f5e1da] mt-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full flex items-center gap-3">
            <label htmlFor="motherName" className="whitespace-nowrap text-xs font-black uppercase tracking-[0.1em] text-[#8b5e5e] flex items-center gap-2">
              <Heart size={16} fill="currentColor" />
              <span>Nome da Mãe:</span>
            </label>
            <input 
              id="motherName"
              type="text" 
              value={motherName}
              onChange={(e) => setMotherName(e.target.value)}
              placeholder="Ex: Maria, Ana, Helena..."
              className="flex-1 min-w-0 px-5 py-3 bg-[#fdf8f6] border-2 border-[#f5e1da] rounded-2xl focus:border-[#8b5e5e] outline-none transition-all text-[#5d3a3a] text-base font-semibold placeholder:text-[#a67c7c]/50"
            />
          </div>
          <button 
            type="button"
            onClick={() => {
              handleGenerateCustomMessage(activeCategory);
            }}
            disabled={isGeneratingMessage}
            className="w-full sm:w-auto bg-[#8b5e5e] text-white px-8 py-3 rounded-2xl font-black uppercase tracking-wider hover:bg-[#7a5252] active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGeneratingMessage ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Gerando...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Personalizar</span>
              </>
            )}
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto mt-12 px-4">
        <AnimatePresence mode="wait">
          {activeCategory === 'especiais' ? (
            <motion.div 
              key="especiais"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {!isPremiumUnlocked ? (
                <div className="bg-white p-12 rounded-3xl shadow-sm border border-[#f5e1da] text-center">
                  <Sparkles className="mx-auto mb-4 text-[#f5e1da]" size={48} />
                  <h2 className="serif text-3xl text-[#8b5e5e] mb-4">Mensagens Especiais 💌</h2>
                  <p className="text-[#a67c7c] mb-8 max-w-md mx-auto">Libere textos longos, emocionantes e a criação de caricaturas artísticas assistindo a um anúncio.</p>
                  <button 
                    onClick={() => setShowAdModal(true)}
                    className="bg-[#8b5e5e] text-white px-10 py-4 rounded-full font-bold hover:bg-[#7a5252] transition-all shadow-lg flex items-center gap-2 mx-auto"
                  >
                    <Sparkles size={20} /> Liberar Acesso Exclusivo
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Premium Message Display */}
                  <section className="bg-white p-8 rounded-3xl shadow-sm border border-[#f5e1da] text-center min-h-[300px] flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-4 right-4 bg-[#fce7e1] text-[#8b5e5e] text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Exclusivo</div>
                    {isGeneratingMessage ? (
                      <div className="space-y-4">
                        <Loader2 className="animate-spin mx-auto text-[#8b5e5e]" size={48} />
                        <p className="text-[#a67c7c] animate-pulse">Tecendo palavras de amor...</p>
                      </div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-8"
                      >
                        <p className="serif text-2xl italic text-[#4a3a3a] leading-relaxed">"{customMessage}"</p>
                        <div className="flex flex-wrap justify-center gap-4">
                          <button 
                            onClick={() => handleShare(customMessage)}
                            className="flex items-center gap-2 bg-[#8b5e5e] text-white px-8 py-3 rounded-full hover:bg-[#7a5252] transition-colors font-medium shadow-md"
                          >
                            <Share2 size={20} /> Compartilhar
                          </button>
                          <button 
                            onClick={() => handleGenerateCustomMessage('especiais')}
                            className="flex items-center gap-2 border-2 border-[#8b5e5e] text-[#8b5e5e] px-8 py-3 rounded-full hover:bg-[#fffaf9] transition-colors font-medium"
                          >
                            <RefreshCw size={20} /> Nova Mensagem
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </section>

                  {/* Caricature Section */}
                  <section className="bg-white p-8 rounded-3xl shadow-sm border border-[#f5e1da] text-center">
                    <h3 className="serif text-2xl text-[#8b5e5e] mb-2">Criação de Caricatura Artística 🎨</h3>
                    <p className="text-[#a67c7c] mb-8">Envie uma foto e crie uma arte personalizada exclusiva para sua mãe.</p>

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
                              <p className="text-xs uppercase tracking-widest text-[#a67c7c]">Foto Original</p>
                              <img src={selectedImage} alt="Original" className="w-full aspect-square object-cover rounded-2xl shadow-sm" />
                            </div>
                            <div className="space-y-2">
                              <p className="text-xs uppercase tracking-widest text-[#a67c7c]">Caricatura</p>
                              <div className="w-full aspect-square bg-[#fdf8f6] rounded-2xl border border-[#f5e1da] flex items-center justify-center overflow-hidden">
                                {isGeneratingCaricature ? (
                                  <div className="text-center p-4">
                                    <Loader2 className="animate-spin mx-auto text-[#8b5e5e] mb-3" size={40} />
                                    <motion.p 
                                      key={loadingStep}
                                      initial={{ opacity: 0, y: 5 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className="text-sm font-medium text-[#8b5e5e]"
                                    >
                                      {loadingMessages[loadingStep]}
                                    </motion.p>
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
                  </section>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="messages"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <section className="bg-white p-8 rounded-3xl shadow-sm border border-[#f5e1da] text-center min-h-[300px] flex flex-col justify-center">
                {isGeneratingMessage ? (
                  <div className="space-y-4">
                    <Loader2 className="animate-spin mx-auto text-[#8b5e5e]" size={48} />
                    <p className="text-[#a67c7c] animate-pulse">Escrevendo algo especial...</p>
                  </div>
                ) : customMessage ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-8"
                  >
                    <p className="serif text-3xl italic text-[#4a3a3a] leading-relaxed">"{customMessage}"</p>
                    <div className="flex flex-wrap justify-center gap-4">
                      <button 
                        onClick={() => handleShare(customMessage)}
                        className="flex items-center gap-2 bg-[#8b5e5e] text-white px-8 py-3 rounded-full hover:bg-[#7a5252] transition-colors font-medium shadow-md"
                      >
                        <Share2 size={20} /> Compartilhar
                      </button>
                      <button 
                        onClick={() => handleGenerateCustomMessage(activeCategory)}
                        className="flex items-center gap-2 border-2 border-[#8b5e5e] text-[#8b5e5e] px-8 py-3 rounded-full hover:bg-[#fffaf9] transition-colors font-medium"
                      >
                        <RefreshCw size={20} /> Nova Mensagem
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    <Sparkles className="mx-auto text-[#f5e1da]" size={48} />
                    <p className="text-[#a67c7c]">Selecione uma categoria acima para começar</p>
                  </div>
                )}
              </section>
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
        <div className="flex flex-col items-center gap-4 mb-8">
          <button 
            onClick={() => setShowRatingPrompt(true)}
            className="flex items-center gap-2 text-[#8b5e5e] hover:text-[#7a5252] font-bold text-sm bg-white px-6 py-3 rounded-full shadow-sm border border-[#f5e1da] transition-all"
          >
            Avaliar App ⭐⭐⭐⭐⭐
          </button>
        </div>
        <div className="w-12 h-1 bg-[#f5e1da] mx-auto mb-6 rounded-full" />
        <p className="serif italic text-[#a67c7c]">Feito com carinho para todas as mães</p>
      </footer>
    </div>
  );
}
