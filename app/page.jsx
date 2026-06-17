
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, Trophy, Gift, Star, Clock, Zap, Flame, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"
import AuthModal from "@/components/auth-modal"
import BetSlip from "@/components/bet-slip"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { useToast } from "@/hooks/use-toast"

import { apiGet } from "@/lib/api"

export default function Home() {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState("register")
  const [showBetSlip, setShowBetSlip] = useState(false)
  const [selectedBets, setSelectedBets] = useState([])
  const { toast } = useToast()

  useEffect(() => {
    const handleLoadBets = (e) => {
      if (e.detail?.bets) {
        setSelectedBets(e.detail.bets)
        setShowBetSlip(true)
      }
    }
    window.addEventListener("load-bets", handleLoadBets)
    return () => window.removeEventListener("load-bets", handleLoadBets)
  }, [])

  const [currentSlide, setCurrentSlide] = useState(0)
  const [featuredMatches, setFeaturedMatches] = useState([])
  const [loadingMatches, setLoadingMatches] = useState(true)

  const openAuthModal = (tab) => {
    setAuthModalTab(tab)
    setAuthModalOpen(true)
  }

  const handleBetSelection = (match, type, odds) => {
    const marketType = "1x2"
    
    // Buscar si ya hay una apuesta para este partido y mercado
    const existingBetIndex = selectedBets.findIndex((bet) => bet.id === match.id && bet.marketType === marketType);

    if (existingBetIndex >= 0) {
      const existingBet = selectedBets[existingBetIndex]
      const newBets = [...selectedBets];
      
      // Si hizo clic en la misma opción que ya tenía, la quitamos (toggle)
      if (existingBet.type === type) {
        newBets.splice(existingBetIndex, 1);
        setSelectedBets(newBets);
        toast({
          title: "Apuesta removida",
          description: `${getSelectionName(match, type)} removida del boleto`,
        });
      } else {
        // Si hizo clic en una opción diferente (ej. tenía Local y ahora Empate), la reemplazamos
        newBets[existingBetIndex] = {
          id: match.id,
          league: match.liga,
          match: `${match.equipoLocal} vs ${match.equipoVisitante}`,
          type,
          odds,
          selection: getSelectionName(match, type),
          marketType,
        };
        setSelectedBets(newBets);
        setShowBetSlip(true);
        toast({
          title: "Selección actualizada",
          description: `Cambiada a ${getSelectionName(match, type)} - Cuota: ${odds}`,
        });
      }
    } else {
      const newBet = {
        id: match.id,
        league: match.liga,
        match: `${match.equipoLocal} vs ${match.equipoVisitante}`,
        type,
        odds,
        selection: getSelectionName(match, type),
        marketType,
      };
      setSelectedBets([...selectedBets, newBet]);
      setShowBetSlip(true);
      toast({
        title: "Apuesta agregada",
        description: `${getSelectionName(match, type)} - Cuota: ${odds}`,
      });
    }
  };

  const getSelectionName = (match, type) => {
    switch (type) {
      case "home":
        return match.equipoLocal
      case "away":
        return match.equipoVisitante
      case "draw":
        return "Empate"
      default:
        return ""
    }
  }

  const isBetSelected = (matchId, type) => {
    return selectedBets.some((bet) => bet.id === matchId && bet.type === type)
  }

  const removeBet = (id, type, marketType) => {
    setSelectedBets(selectedBets.filter((bet) => !(bet.id === id && bet.type === type && bet.marketType === marketType)))
  }

  // Cambiar diapositivas automáticamente cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Animación para los elementos
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  // Promociones destacadas para el carrusel
  const promotions = [
    {
      id: 1,
      title: "Bono de Bienvenida 200%",
      description: "¡Duplicamos tu primer depósito hasta Bs 500! Regístrate ahora y comienza a ganar.",
      image: "/ce46161f9aae10d7b6b34d9023e0ac72.jpg?height=400&width=800&text=Bono+Bienvenida",
      color: "from-green-500 to-blue-600",
    },
    {
      id: 2,
      title: "Apuesta Sin Riesgo",
      description: "Haz tu primera apuesta sin riesgo. Si pierdes, te devolvemos hasta Bs 100.",
      image: "/Portada.png.webp?height=400&width=800&text=Apuesta+Sin+Riesgo",
      color: "from-purple-500 to-pink-600",
    },
    {
      id: 3,
      title: "50 Giros Gratis",
      description: "Recibe 50 giros gratis en nuestras mejores tragamonedas al registrarte.",
      image: "/placeholder.svg?height=400&width=800&text=Giros+Gratis",
      color: "from-yellow-500 to-red-600",
    },
  ]

  // Lista de prioridad estricta definida por el usuario
  const PRIORIDAD_LIGAS = [
    { id: 1, terms: ['copa del mundo', 'world cup'], pais: null },
    { id: 2, terms: ['champions league', 'uefa champions'], pais: null },
    { id: 3, terms: ['liga boliviana', 'primera división', 'primera division'], pais: ['bolivia'] },
    { id: 4, terms: ['copa américa', 'copa america'], pais: null },
    { id: 5, terms: ['libertadores', 'copa libertadores'], pais: null },
    { id: 6, terms: ['europa league', 'uefa europa'], pais: null },
    { id: 7, terms: ['laliga', 'la liga'], pais: ['españa', 'spain'] },
    { id: 8, terms: ['premier league'], pais: ['inglaterra', 'england'] },
    { id: 9, terms: ['serie a'], pais: ['italia', 'italy'] },
    { id: 10, terms: ['bundesliga'], pais: ['alemania', 'germany'] },
    { id: 11, terms: ['ligue 1'], pais: ['francia', 'france'] },
    { id: 12, terms: ['mls', 'major league soccer'], pais: ['estados unidos', 'usa'] },
    { id: 13, terms: ['copa confederaciones'], pais: null },
    { id: 14, terms: ['supercopa de europa', 'uefa super cup'], pais: null },
    { id: 15, terms: ['fa cup'], pais: ['inglaterra', 'england'] },
    { id: 16, terms: ['copa del rey'], pais: ['españa', 'spain'] },
    { id: 17, terms: ['coppa italia', 'copa de italia'], pais: ['italia', 'italy'] },
    { id: 18, terms: ['superliga argentina', 'liga profesional'], pais: ['argentina'] },
    { id: 19, terms: ['brasileirão', 'campeonato brasileiro', 'serie a'], pais: ['brasil', 'brazil'] },
    { id: 20, terms: ['copa mx'], pais: ['méxico', 'mexico'] },
    { id: 21, terms: ['primeira liga'], pais: ['portugal'] },
    { id: 22, terms: ['eredivisie'], pais: ['países bajos', 'holanda', 'netherlands'] },
    { id: 23, terms: ['j1 league', 'j-league'], pais: ['japón', 'japan'] },
    { id: 24, terms: ['a-league'], pais: ['australia'] },
    { id: 25, terms: ['chinese super league'], pais: ['china'] },
  ];

  // Función para determinar prioridad de liga
  const obtenerPrioridadLiga = (nombreLiga, nombrePais) => {
    const liga = nombreLiga?.toLowerCase() || "";
    const pais = nombrePais?.toLowerCase() || "";

    for (const regla of PRIORIDAD_LIGAS) {
      const ligaMatch = regla.terms.some(term => liga.includes(term));
      if (ligaMatch) {
        if (regla.pais) {
          const paisMatch = regla.pais.some(p => pais.includes(p));
          if (paisMatch) return regla.id;
        } else {
          return regla.id;
        }
      }
    }
    return 999;
  };

  // Cargar partidos reales
  useEffect(() => {
    const fetchPartidos = async () => {
      try {
        setLoadingMatches(true)
        console.log("Fetching featured matches...");
        const data = await apiGet('/deportes/futbol/partidos')
        console.log("Featured matches data:", data);

        let todosLosPartidos = []
        if (Array.isArray(data)) {
          todosLosPartidos = data
        } else if (data && typeof data === 'object') {
          // Aplanar estructura agrupada por fecha
          Object.values(data).forEach(arr => {
            if (Array.isArray(arr)) todosLosPartidos = [...todosLosPartidos, ...arr]
          })
        }

        const mappedPartidos = todosLosPartidos.map(p => {
          let fechaFormatted = "Fecha desconocida";
          try {
            if (p.fecha) {
              fechaFormatted = new Date(p.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            }
          } catch (e) {
            console.error("Error parsing date:", p.fecha);
          }

          return {
            id: p.id,
            deporte: "futbol",
            liga: p.liga,
            logoLiga: p.logo_liga,
            pais: p.pais?.toLowerCase() || "world",
            equipoLocal: p.equipo_local,
            logoLocal: p.escudo_local,
            equipoVisitante: p.equipo_visitante,
            logoVisitante: p.escudo_visitante,
            fecha: fechaFormatted,
            cuotaLocal: p.cuotas?.main?.["1X2"]?.["1"]?.toFixed(2) || "-",
            cuotaEmpate: p.cuotas?.main?.["1X2"]?.["X"]?.toFixed(2) || "-",
            cuotaVisitante: p.cuotas?.main?.["1X2"]?.["2"]?.toFixed(2) || "-",
            live: p.estado !== "NS",
            tiempo: p.minuto ? `${p.minuto}'` : "LIVE",
            resultado: `${p.goles_local || 0} - ${p.goles_visitante || 0}`,
            stats: { posesion: "50% - 50%", tiros: "5 - 5", corners: "3 - 3" }, // Mock stats
            prioridad: obtenerPrioridadLiga(p.liga, p.pais)
          };
        })

        // Ordenar por prioridad y tomar los top 3
        const destacados = mappedPartidos
          .sort((a, b) => {
            // Primero por prioridad de liga
            if (a.prioridad !== b.prioridad) return a.prioridad - b.prioridad;
            // Luego partidos en vivo primero
            if (a.live !== b.live) return a.live ? -1 : 1;
            return 0;
          })
          .slice(0, 3);

        setFeaturedMatches(destacados)
        console.log("Featured matches set:", destacados);
      } catch (error) {
        console.error("Error loading matches:", error)
      } finally {
        setLoadingMatches(false)
      }
    }

    fetchPartidos()
  }, [])

  // Juegos de casino populares
  const popularCasinoGames = [
    { id: 1, name: "Book of Dead", provider: "Play'n GO", hot: true, new: false, image: "/juegos/juego1.png" },
    { id: 2, name: "Starburst", provider: "NetEnt", hot: true, new: false, image: "/juegos/juego2.jpg" },
    { id: 3, name: "Gonzo's Quest", provider: "NetEnt", hot: true, new: false, image: "/juegos/juego3.jpg" },
    { id: 4, name: "Sweet Bonanza", provider: "Pragmatic Play", hot: false, new: true, image: "/juegos/juego4.png" },
    { id: 5, name: "Wolf Gold", provider: "Pragmatic Play", hot: false, new: false, image: "/juegos/juego5.png" },
    { id: 6, name: "Reactoonz", provider: "Play'n GO", hot: false, new: true, image: "/juegos/juego6.png" },
    { id: 7, name: "Book of Ra", provider: "Novomatic", hot: false, new: false, image: "/juegos/juego7.png" },
    { id: 8, name: "Mega Moolah", provider: "Microgaming", hot: true, new: false, image: "/juegos/juego8.png" },
    { id: 9, name: "Dead or Alive", provider: "NetEnt", hot: false, new: false, image: "/juegos/juego1.png" },
    { id: 10, name: "Divine Fortune", provider: "NetEnt", hot: false, new: true, image: "/juegos/juego2.jpg" },
    { id: 11, name: "Immortal Romance", provider: "Microgaming", hot: false, new: false, image: "/juegos/juego3.jpg" },
    { id: 12, name: "Jammin' Jars", provider: "Push Gaming", hot: true, new: false, image: "/juegos/juego4.png" },
  ]

  // Definir las diapositivas para el carrusel
  const slides = [
    {
      id: 1,
      title: "Bienvenido a TrifoBet",
      description: "El mejor casino online con las mejores apuestas deportivas, juegos y promociones exclusivas",
      image: "/port4.png?height=600&width=1200",
      cta: "Jugar Ahora",
    },
    {
      id: 2,
      title: "Apuestas Deportivas",
      description: "Apuesta en tus deportes favoritos con las mejores cuotas del mercado",
      image: "/port1.png?height=600&width=1200",
      cta: "Apostar",
    },
    {
      id: 3,
      title: "Bono de Bienvenida",
      description: "Regístrate hoy y obtén un bono del 100% en tu primer depósito",
      image: "/port2.png?height=600&width=1200",
      cta: "Registrarse",
    },
  ]

  // Función para manejar los clics en los botones CTA
  const handleCtaClick = (cta) => {
    switch (cta) {
      case "Jugar Ahora":
        break
      case "Apostar":
        break
      case "Registrarse":
        break
      default:
        alert(`Acción: ${cta}`)
    }
  }

  return (
    <div className="flex flex-col gap-8 pb-8">
      {/* Hero Section */}
      <section className="relative h-[600px] w-full overflow-hidden rounded-lg">
        {slides.map((slide, index) => (
          <motion.div
            key={slide.id}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: index === currentSlide ? 1 : 0 }}
            transition={{ duration: 0.5 }}
            style={{
              backgroundImage: `url(${slide.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent dark:from-black/80" />
            <div className="absolute bottom-0 left-0 p-8 md:p-16 md:w-2/3">
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: index === currentSlide ? 0 : 20, opacity: index === currentSlide ? 1 : 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-3xl font-bold text-white md:text-5xl"
              >
                {slide.title}
              </motion.h1>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: index === currentSlide ? 0 : 20, opacity: index === currentSlide ? 1 : 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-4 text-lg text-white/80 md:text-xl"
              >
                {slide.description}
              </motion.p>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: index === currentSlide ? 0 : 20, opacity: index === currentSlide ? 1 : 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="mt-6"
              >
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => handleCtaClick(slide.cta)}
                >
                  {slide.cta}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        ))}
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 w-2 rounded-full ${index === currentSlide ? "bg-primary" : "bg-white/50"}`}
              aria-label={`Ir a diapositiva ${index + 1}`}
            />
          ))}
        </div>

      </section>

      {/* Promociones Carrusel */}
      <section className="container">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold flex items-center">
            <Gift className="mr-2 h-6 w-6 text-primary" />
            Promociones Destacadas
          </h2>
          <Button variant="ghost" asChild>
            <Link href="/promociones" className="flex items-center">
              Ver todas <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <Carousel className="w-full">
          <CarouselContent>
            {promotions.map((promo) => (
              <CarouselItem key={promo.id}>
                <div className="relative h-[200px] sm:h-[250px] md:h-[300px] rounded-xl overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-r ${promo.color} opacity-80 z-10`} />
                  <Image
                    src={promo.image || "/placeholder.svg"}
                    alt={promo.title}
                    width={800}
                    height={400}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 z-20 flex flex-col justify-center p-8 text-white">
                    <h3 className="text-2xl md:text-4xl font-bold mb-2">{promo.title}</h3>
                    <p className="text-sm md:text-lg mb-6 max-w-md">{promo.description}</p>
                    <Button
                      className="w-fit bg-white text-black hover:bg-white/90"
                      onClick={() => openAuthModal("register")}
                    >
                      Reclamar Ahora
                    </Button>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden sm:block">
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </div>
        </Carousel>
      </section>

      {/* Featured Bets */}
      <motion.section
        className="container"
        initial="visible"
        whileInView="visible"
        viewport={{ once: true }}
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold flex items-center">
            <TrendingUp className="mr-2 h-6 w-6 text-primary" />
            Apuestas Destacadas
          </h2>
          <Button variant="ghost" asChild>
            <Link href="/apuestas" className="flex items-center">
              Ver todas <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingMatches ? (
            <motion.div variants={fadeInUp} className="col-span-3 flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </motion.div>
          ) : featuredMatches.length > 0 ? (
            featuredMatches.map((match) => (
              <motion.div key={match.id} variants={fadeInUp}>
                <Card className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 flex flex-col h-full min-h-[350px]">
                  <CardContent className="p-0 flex flex-col flex-1">
                    {/* Header con Liga */}
                    <div className="bg-muted/30 px-4 py-2 border-b flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden w-full">
                        {match.logoLiga ? (
                          <Image
                            src={match.logoLiga}
                            alt={match.liga}
                            width={16}
                            height={16}
                            className="object-contain"
                          />
                        ) : (
                          <Trophy className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground truncate" title={match.liga}>
                          {match.liga}
                        </span>
                      </div>
                    </div>

                    {/* Equipos y Marcador */}
                    <div className="p-5 flex-grow flex flex-col justify-center">
                      <div className="flex items-center justify-between gap-2">
                        {/* Equipo Local */}
                        <div className="flex flex-col items-center text-center w-1/3">
                          <div className="relative w-16 h-16 mb-3 p-2 bg-white/5 rounded-full border border-border/50 shadow-sm flex items-center justify-center">
                            {match.logoLocal ? (
                              <Image
                                src={match.logoLocal}
                                alt={match.equipoLocal}
                                width={48}
                                height={48}
                                className="object-contain max-h-full max-w-full"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                                {match.equipoLocal.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-bold leading-tight line-clamp-2 min-h-[2.5em] flex items-center justify-center">
                            {match.equipoLocal}
                          </span>
                        </div>

                        {/* VS / Marcador / Tiempo */}
                        <div className="flex flex-col items-center justify-center w-1/3 px-1">
                          {match.live ? (
                            <div className="flex flex-col items-center gap-1">
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 mb-1">
                                <span className="animate-pulse mr-1">●</span> {match.tiempo}
                              </Badge>
                              <div className="text-2xl font-black tracking-tighter flex items-center gap-2 bg-muted/20 px-2 py-0.5 rounded-lg border border-border/50">
                                <span>{match.resultado?.split(" - ")[0]}</span>
                                <span className="text-muted-foreground/50">-</span>
                                <span>{match.resultado?.split(" - ")[1]}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <div className="text-[10px] font-medium text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                                {match.fecha.includes(',') ? match.fecha.split(',')[1].trim() : match.fecha}
                              </div>
                              <span className="text-sm font-black text-muted-foreground/40">VS</span>
                              <div className="text-[10px] text-muted-foreground/60">
                                {match.fecha.includes(',') ? match.fecha.split(',')[0] : ''}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Equipo Visitante */}
                        <div className="flex flex-col items-center text-center w-1/3">
                          <div className="relative w-16 h-16 mb-3 p-2 bg-white/5 rounded-full border border-border/50 shadow-sm flex items-center justify-center">
                            {match.logoVisitante ? (
                              <Image
                                src={match.logoVisitante}
                                alt={match.equipoVisitante}
                                width={48}
                                height={48}
                                className="object-contain max-h-full max-w-full"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                                {match.equipoVisitante.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-bold leading-tight line-clamp-2 min-h-[2.5em] flex items-center justify-center">
                            {match.equipoVisitante}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botones de Apuesta */}
                    <div className="px-4 pb-4">
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <Button
                          variant={isBetSelected(match.id, "home") ? "default" : "outline"}
                          className={`h-auto py-2 flex flex-col gap-0.5 border-muted-foreground/20 hover:border-primary/50 transition-all ${isBetSelected(match.id, "home")
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "hover:bg-primary/5"
                            }`}
                          onClick={() => handleBetSelection(match, "home", match.cuotaLocal)}
                        >
                          <span className="text-[10px] uppercase text-muted-foreground font-semibold">1</span>
                          <span className="font-bold text-base">{match.cuotaLocal}</span>
                        </Button>
                        <Button
                          variant={isBetSelected(match.id, "draw") ? "default" : "outline"}
                          className={`h-auto py-2 flex flex-col gap-0.5 border-muted-foreground/20 hover:border-primary/50 transition-all ${isBetSelected(match.id, "draw")
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "hover:bg-primary/5"
                            }`}
                          onClick={() => handleBetSelection(match, "draw", match.cuotaEmpate)}
                        >
                          <span className="text-[10px] uppercase text-muted-foreground font-semibold">X</span>
                          <span className="font-bold text-base">{match.cuotaEmpate}</span>
                        </Button>
                        <Button
                          variant={isBetSelected(match.id, "away") ? "default" : "outline"}
                          className={`h-auto py-2 flex flex-col gap-0.5 border-muted-foreground/20 hover:border-primary/50 transition-all ${isBetSelected(match.id, "away")
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "hover:bg-primary/5"
                            }`}
                          onClick={() => handleBetSelection(match, "away", match.cuotaVisitante)}
                        >
                          <span className="text-[10px] uppercase text-muted-foreground font-semibold">2</span>
                          <span className="font-bold text-base">{match.cuotaVisitante}</span>
                        </Button>
                      </div>
                    </div>
                    <div className="px-4 pb-4">
                      <Link href={`/apuestas/partido/${match.id}`} className="w-full">
                        <Button className="w-full bg-gradient-to-r from-primary/80 to-primary hover:from-primary hover:to-primary/80">
                          +{match.live ? "35" : "120"} mercados
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (

            <motion.div variants={fadeInUp} className="col-span-3 flex flex-col items-center justify-center py-12 text-center bg-card/50 rounded-lg border border-dashed">
              <div className="bg-muted/20 rounded-full p-4 mb-4">
                <Trophy className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium">No hay partidos destacados</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                En este momento no hay partidos destacados disponibles. Revisa la sección completa para ver todos los eventos.
              </p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/apuestas">Ver todos los partidos</Link>
              </Button>
            </motion.div>
          )
          }
        </div >
      </motion.section >

      {/* Casino Games */}
      < motion.section
        className="container"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold flex items-center">
            <Flame className="mr-2 h-6 w-6 text-primary" />
            Juegos de Casino
          </h2>
          <Button variant="ghost" asChild>
            <Link href="/casino" className="flex items-center">
              Ver todos <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="populares" className="w-full">
          <TabsList className="mb-6 flex flex-wrap h-auto p-1">
            <TabsTrigger
              value="populares"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Populares
            </TabsTrigger>
            <TabsTrigger
              value="slots"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Slots
            </TabsTrigger>
            <TabsTrigger
              value="mesa"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Juegos de Mesa
            </TabsTrigger>

            <TabsTrigger
              value="nuevos"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Nuevos
            </TabsTrigger>
          </TabsList>
          <TabsContent value="populares" className="mt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {popularCasinoGames.map((game) => (
                <motion.div key={game.id} variants={fadeInUp}>
                  <Link href="/casino/juego" className="group block">
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2">
                      <Image
                        src={game.image || "/placeholder.svg"}
                        alt={game.name}
                        width={225}
                        height={300}
                        className="object-cover w-full h-full transition-transform group-hover:scale-110 duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <Button className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-4 bg-primary hover:bg-primary/90">
                          Jugar Ahora
                        </Button>
                      </div>
                      {game.hot && (
                        <Badge className="absolute top-2 left-2 bg-red-500 text-white border-red-500">
                          <Flame className="h-3 w-3 mr-1" /> Popular
                        </Badge>
                      )}
                      {game.new && (
                        <Badge className="absolute top-2 left-2 bg-blue-500 text-white border-blue-500">
                          <Zap className="h-3 w-3 mr-1" /> Nuevo
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-base font-medium truncate">{game.name}</h3>
                    <p className="text-xs text-muted-foreground">{game.provider}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="slots" className="mt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {popularCasinoGames
                .filter((_, i) => i < 6)
                .map((game) => (
                  <Link href="/casino/juego" key={game.id} className="group block">
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2">
                      <Image
                        src={game.image || "/placeholder.svg"}
                        alt={game.name}
                        width={225}
                        height={300}
                        className="object-cover w-full h-full transition-transform group-hover:scale-110 duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <Button className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-4 bg-primary hover:bg-primary/90">
                          Jugar Ahora
                        </Button>
                      </div>
                      {game.hot && (
                        <Badge className="absolute top-2 left-2 bg-red-500 text-white border-red-500">
                          <Flame className="h-3 w-3 mr-1" /> Popular
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-base font-medium truncate">{game.name}</h3>
                    <p className="text-xs text-muted-foreground">{game.provider}</p>
                  </Link>
                ))}
            </div>
          </TabsContent>
          <TabsContent value="mesa" className="mt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {["Poker", "Blackjack", "Ruleta", "Baccarat", "Craps", "Sic Bo"].map((game, i) => (
                <Link href="/casino/juego" key={i} className="group block">
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2">
                    <Image
                      src={`/placeholder.svg?height=300&width=225&text=${game}`}
                      alt={game}
                      width={225}
                      height={300}
                      className="object-cover w-full h-full transition-transform group-hover:scale-110 duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <Button className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-4 bg-primary hover:bg-primary/90">
                        Jugar Ahora
                      </Button>
                    </div>
                  </div>
                  <h3 className="text-base font-medium truncate">{game}</h3>
                  <p className="text-xs text-muted-foreground">Juego de Mesa</p>
                </Link>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="vivo" className="mt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                "Poker Live",
                "Blackjack Live",
                "Ruleta Live",
                "Baccarat Live",
                "Casino Holdem Live",
                "Lightning Roulette",
              ].map((game, i) => (
                <Link href="/casino/juego" key={i} className="group block">
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2">
                    <Image
                      src={`/placeholder.svg?height=300&width=225&text=${game}`}
                      alt={game}
                      width={225}
                      height={300}
                      className="object-cover w-full h-full transition-transform group-hover:scale-110 duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <Button className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-4 bg-primary hover:bg-primary/90">
                        Jugar Ahora
                      </Button>
                    </div>
                    <Badge className="absolute top-2 left-2 bg-red-500 text-white border-red-500">
                      <span className="animate-pulse mr-1">●</span> En Vivo
                    </Badge>
                  </div>
                  <h3 className="text-base font-medium truncate">{game}</h3>
                  <p className="text-xs text-muted-foreground">Casino en Vivo</p>
                </Link>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="nuevos" className="mt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {popularCasinoGames
                .filter((game) => game.new)
                .concat(popularCasinoGames.filter((game) => !game.new).slice(0, 4))
                .map((game) => (
                  <Link href="/casino/juego" key={game.id} className="group block">
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2">
                      <Image
                        src={game.image || "/placeholder.svg"}
                        alt={game.name}
                        width={225}
                        height={300}
                        className="object-cover w-full h-full transition-transform group-hover:scale-110 duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <Button className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-4 bg-primary hover:bg-primary/90">
                          Jugar Ahora
                        </Button>
                      </div>
                      <Badge className="absolute top-2 left-2 bg-blue-500 text-white border-blue-500">
                        <Zap className="h-3 w-3 mr-1" /> Nuevo
                      </Badge>
                    </div>
                    <h3 className="text-base font-medium truncate">{game.name}</h3>
                    <p className="text-xs text-muted-foreground">{game.provider}</p>
                  </Link>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </motion.section >

      {/* Promotions */}
      < motion.section
        className="container"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold flex items-center">
            <Gift className="mr-2 h-6 w-6 text-primary" />
            Promociones
          </h2>
          <Button variant="ghost" asChild>
            <Link href="/promociones" className="flex items-center">
              Ver todas <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Bono de Bienvenida",
              description: "¡Obtén un 100% de bonificación en tu primer depósito hasta Bs 500!",
              icon: Gift,
              color: "bg-gradient-to-br from-green-500 to-green-700",
            },
            {
              title: "Apuesta Sin Riesgo",
              description: "Haz tu primera apuesta sin riesgo. Si pierdes, te devolvemos hasta Bs 100.",
              icon: Trophy,
              color: "bg-gradient-to-br from-blue-500 to-blue-700",
            },
            {
              title: "Giros Gratis",
              description: "Recibe 50 giros gratis en nuestras mejores tragamonedas al registrarte.",
              icon: Star,
              color: "bg-gradient-to-br from-purple-500 to-purple-700",
            },
          ].map((promo, index) => (
            <motion.div key={index} variants={fadeInUp}>
              <Card className="overflow-hidden h-full border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-6 h-full flex flex-col">
                  <div
                    className={`p-3 rounded-full ${promo.color} text-white w-12 h-12 flex items-center justify-center mb-4`}
                  >
                    <promo.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">{promo.title}</h3>
                  <p className="text-muted-foreground mb-6 flex-grow">{promo.description}</p>
                  <Button
                    className="w-full bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90 transition-all duration-300"
                    onClick={() => openAuthModal("register")}
                  >
                    Reclamar Ahora
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section >

      {/* CTA Section */}
      < section className="bg-primary/10 py-12" >
        <div className="container text-center">
          <motion.h2
            className="text-2xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            ¿Listo para comenzar?
          </motion.h2>
          <motion.p
            className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Únete a miles de jugadores y disfruta de la mejor experiencia de casino y apuestas en línea.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Button
              size="lg"
              onClick={() => openAuthModal("register")}
              className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 transition-all duration-300"
            >
              Crear Cuenta
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/nosotros">Conocer Más</Link>
            </Button>
          </motion.div>
        </div>
      </section >

      {/* Bet Slip */}
      < BetSlip 
        open={showBetSlip} 
        onOpenChange={setShowBetSlip} 
        bets={selectedBets} 
        onRemoveBet={removeBet} 
        onClearAll={() => setSelectedBets([])}
      />

      {/* Auth Modal */}
      < AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} defaultTab={authModalTab} />
    </div >
  )
}
