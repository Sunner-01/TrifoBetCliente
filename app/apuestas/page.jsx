"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Clock,
  Search,
  Star,
  Filter,
  TrendingUp,
  Play,
  Users,
  Target,
  Trophy,
  Zap,
  ChevronRight,
  Globe,
  Radio,
} from "lucide-react"
import BetSlip from "@/components/bet-slip"
import { LiveChat } from "@/components/live-chat"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import Image from "next/image"
import { apiGet } from "@/lib/api"
import { useEffect } from "react"

function OddsButton({ label, sublabel, odds, selected, onClick }) {
  if (!odds || odds === "-") return null
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-2 text-center transition-all duration-200 border font-medium
        ${selected
          ? "bg-primary border-primary text-primary-foreground shadow-sm scale-[1.02]"
          : "bg-secondary/40 border-border/60 hover:border-primary/50 hover:bg-secondary/80 text-foreground shadow-sm"
        }`}
    >
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-bold opacity-60 uppercase">{label}</span>
        {sublabel && <span className="text-[9px] uppercase tracking-wide opacity-50">{sublabel}</span>}
      </div>
      <span className="text-sm font-black">{odds}</span>
    </button>
  )
}

function MatchCard({ partido, onBet, isBetSelected }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 flex flex-col">
      {/* Header - League */}
      <div className="px-4 py-2.5 flex items-center justify-between bg-muted/20 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Trophy className="h-3.5 w-3.5 text-primary/70" />
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{partido.liga}</span>
        </div>
        {partido.live && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
            <Radio className="h-2.5 w-2.5 animate-pulse" />
            EN VIVO
          </span>
        )}
      </div>

      {/* Main Teams & Score */}
      <div className="px-4 py-5 flex items-center justify-between gap-2">
        <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-muted shadow-sm">
            <Image src={partido.logoLocal || "/placeholder.svg"} alt={partido.equipoLocal} width={32} height={32} className="object-contain" />
          </div>
          <span className="font-bold text-sm text-center line-clamp-2 leading-tight">{partido.equipoLocal}</span>
        </div>

        <div className="flex flex-col items-center justify-center px-2 min-w-[80px]">
          <div className="text-[10px] font-bold text-muted-foreground mb-1.5 whitespace-nowrap bg-muted/50 px-2 py-0.5 rounded-full uppercase">
            {partido.live ? (
              <span className="text-red-500 flex items-center gap-1"><Clock className="h-2.5 w-2.5"/>{partido.tiempo}</span>
            ) : (
              <span>{partido.fecha}</span>
            )}
          </div>
          
          {partido.live ? (
            <span className="text-2xl font-black text-primary tabular-nums tracking-tighter">{partido.resultado}</span>
          ) : (
            <span className="text-sm font-black text-muted-foreground/50">VS</span>
          )}
        </div>

        <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-muted shadow-sm">
            <Image src={partido.logoVisitante || "/placeholder.svg"} alt={partido.equipoVisitante} width={32} height={32} className="object-contain" />
          </div>
          <span className="font-bold text-sm text-center line-clamp-2 leading-tight">{partido.equipoVisitante}</span>
        </div>
      </div>

      {/* Markets Section */}
      <div className="px-4 pb-4 mt-auto">
        <div className="grid grid-cols-3 gap-2">
          <OddsButton label="1" odds={partido.cuotaLocal} selected={isBetSelected(partido.id, "home", "1x2")} onClick={() => onBet(partido, "home", partido.cuotaLocal, "1x2")} />
          {partido.cuotaEmpate ? (
            <OddsButton label="X" odds={partido.cuotaEmpate} selected={isBetSelected(partido.id, "draw", "1x2")} onClick={() => onBet(partido, "draw", partido.cuotaEmpate, "1x2")} />
          ) : (
            <div />
          )}
          <OddsButton label="2" odds={partido.cuotaVisitante} selected={isBetSelected(partido.id, "away", "1x2")} onClick={() => onBet(partido, "away", partido.cuotaVisitante, "1x2")} />
        </div>

        <Link href={`/apuestas/partido/${partido.id}`} className="block mt-3">
          <div className="w-full text-center py-2 text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors border-t border-border/50 pt-3">
            +{partido.mercados || 50} MERCADOS DISPONIBLES <ChevronRight className="inline h-3 w-3 -mt-0.5" />
          </div>
        </Link>
      </div>
    </div>
  )
}

export default function ApuestasPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCountry, setSelectedCountry] = useState("todos")
  const [selectedLeague, setSelectedLeague] = useState("todas")
  const [showBetSlip, setShowBetSlip] = useState(false)
  const [selectedBets, setSelectedBets] = useState([])
  const [partidos, setPartidos] = useState([])
  const [loading, setLoading] = useState(true)
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

  // Lista de prioridad estricta definida por el usuario (misma que en FutbolPage)
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

  const formatearFecha = (fechaRaw) => {
    try {
      const fecha = new Date(fechaRaw);
      if (isNaN(fecha.getTime())) return String(fechaRaw);
      
      const hoy = new Date();
      const manana = new Date();
      manana.setDate(hoy.getDate() + 1);
      
      const hora = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      
      const isHoy = fecha.getDate() === hoy.getDate() && fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
      const isManana = fecha.getDate() === manana.getDate() && fecha.getMonth() === manana.getMonth() && fecha.getFullYear() === manana.getFullYear();
      
      if (isHoy) return hora;
      if (isManana) return `Mañana, ${hora}`;
      return `${fecha.getDate()}/${fecha.getMonth() + 1}, ${hora}`;
    } catch {
      return String(fechaRaw);
    }
  };

  // Cargar partidos reales
  useEffect(() => {
    const fetchPartidos = async () => {
      try {
        setLoading(true)
        const data = await apiGet('/deportes/futbol/partidos')

        let todosLosPartidos = []
        if (Array.isArray(data)) {
          todosLosPartidos = data
        } else if (data && typeof data === 'object') {
          Object.values(data).forEach(arr => {
            if (Array.isArray(arr)) todosLosPartidos = [...todosLosPartidos, ...arr]
          })
        }

        // Mapear partidos
        const mappedPartidos = todosLosPartidos.map(p => ({
          id: p.id,
          deporte: "futbol",
          liga: p.liga,
          pais: p.pais?.toLowerCase() || "world",
          equipoLocal: p.equipo_local,
          equipoVisitante: p.equipo_visitante,
          logoLocal: p.escudo_local,
          logoVisitante: p.escudo_visitante,
          fecha: formatearFecha(p.fecha),
          cuotaLocal: p.cuotas?.main?.["1X2"]?.["1"]?.toFixed(2) || "-",
          cuotaEmpate: p.cuotas?.main?.["1X2"]?.["X"]?.toFixed(2) || "-",
          cuotaVisitante: p.cuotas?.main?.["1X2"]?.["2"]?.toFixed(2) || "-",
          overUnder: {
            over: p.cuotas?.goals?.total?.["2.5"]?.over?.toFixed(2) || "-",
            under: p.cuotas?.goals?.total?.["2.5"]?.under?.toFixed(2) || "-",
            line: "2.5"
          },
          live: p.estado !== "NS",
          tiempo: p.minuto ? `${p.minuto}'` : "LIVE",
          resultado: `${p.goles_local || 0} - ${p.goles_visitante || 0}`,
          mercados: 50, // Mock
          estadio: "Estadio Principal",
          temperatura: "20°C",
          // Calcular prioridad aquí para ordenar después
          prioridad: obtenerPrioridadLiga(p.liga, p.pais)
        }))

        // Ordenar por prioridad y tomar los top 3 para "Destacados"
        // Si no hay suficientes de las ligas top, se rellenarán con los siguientes en prioridad
        const destacados = mappedPartidos
          .sort((a, b) => a.prioridad - b.prioridad)
          .slice(0, 3);

        setPartidos(destacados)


      } catch (error) {
        console.error("Error loading matches:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPartidos()
  }, [])

  const deportes = [
    { id: "futbol", name: "Fútbol", icon: "⚽", count: 1247, active: true },
    { id: "baloncesto", name: "Baloncesto", icon: "🏀", count: 432, active: true },
    { id: "tenis", name: "Tenis", icon: "🎾", count: 328, active: true },
    { id: "beisbol", name: "Béisbol", icon: "⚾", count: 218, active: true },
    { id: "hockey", name: "Hockey", icon: "🏒", count: 156, active: true },
    { id: "voleibol", name: "Voleibol", icon: "🏐", count: 89, active: true },
    { id: "futbol-americano", name: "Fútbol Americano", icon: "🏈", count: 167, active: true },
    { id: "rugby", name: "Rugby", icon: "🏉", count: 78, active: true },
    { id: "golf", name: "Golf", icon: "⛳", count: 45, active: true },
    { id: "boxeo", name: "Boxeo", icon: "🥊", count: 34, active: true },
    { id: "mma", name: "MMA", icon: "🥋", count: 28, active: true },
    { id: "formula1", name: "Fórmula 1", icon: "🏎️", count: 12, active: true },
    { id: "ciclismo", name: "Ciclismo", icon: "🚴", count: 23, active: true },
    { id: "esports", name: "eSports", icon: "🎮", count: 156, active: true },
    { id: "dardos", name: "Dardos", icon: "🎯", count: 19, active: true },
  ]

  const paises = [
    { id: "todos", name: "Todos los países", flag: "🌍", count: 2847 },
    { id: "espana", name: "España", flag: "🇪🇸", count: 234 },
    { id: "inglaterra", name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", count: 198 },
    { id: "alemania", name: "Alemania", flag: "🇩🇪", count: 167 },
    { id: "italia", name: "Italia", flag: "🇮🇹", count: 145 },
    { id: "francia", name: "Francia", flag: "🇫🇷", count: 134 },
    { id: "brasil", name: "Brasil", flag: "🇧🇷", count: 123 },
    { id: "argentina", name: "Argentina", flag: "🇦🇷", count: 98 },
    { id: "usa", name: "Estados Unidos", flag: "🇺🇸", count: 287 },
    { id: "mexico", name: "México", flag: "🇲🇽", count: 76 },
    { id: "portugal", name: "Portugal", flag: "🇵🇹", count: 54 },
    { id: "holanda", name: "Países Bajos", flag: "🇳🇱", count: 43 },
    { id: "colombia", name: "Colombia", flag: "🇨🇴", count: 38 },
    { id: "chile", name: "Chile", flag: "🇨🇱", count: 29 },
    { id: "uruguay", name: "Uruguay", flag: "🇺🇾", count: 24 },
  ]

  const ligas = {
    futbol: [
      { id: "laliga", name: "LaLiga", country: "España", flag: "🇪🇸", count: 45, tier: 1 },
      { id: "premier", name: "Premier League", country: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", count: 38, tier: 1 },
      { id: "bundesliga", name: "Bundesliga", country: "Alemania", flag: "🇩🇪", count: 34, tier: 1 },
      { id: "seriea", name: "Serie A", country: "Italia", flag: "🇮🇹", count: 32, tier: 1 },
      { id: "ligue1", name: "Ligue 1", country: "Francia", flag: "🇫🇷", count: 28, tier: 1 },
      { id: "champions", name: "Champions League", country: "Europa", flag: "🇪🇺", count: 16, tier: 1 },
      { id: "europa", name: "Europa League", country: "Europa", flag: "🇪🇺", count: 24, tier: 2 },
      { id: "segunda", name: "Segunda División", country: "España", flag: "🇪🇸", count: 42, tier: 2 },
      { id: "championship", name: "Championship", country: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", count: 46, tier: 2 },
      { id: "brasileirao", name: "Brasileirão", country: "Brasil", flag: "🇧🇷", count: 38, tier: 1 },
      { id: "liga-mx", name: "Liga MX", country: "México", flag: "🇲🇽", count: 34, tier: 1 },
      { id: "mls", name: "MLS", country: "Estados Unidos", flag: "🇺🇸", count: 56, tier: 1 },
    ],
    baloncesto: [
      { id: "nba", name: "NBA", country: "Estados Unidos", flag: "🇺🇸", count: 82, tier: 1 },
      { id: "euroliga", name: "Euroliga", country: "Europa", flag: "🇪🇺", count: 34, tier: 1 },
      { id: "acb", name: "Liga ACB", country: "España", flag: "🇪🇸", count: 36, tier: 1 },
      { id: "serie-a-basket", name: "Serie A", country: "Italia", flag: "🇮🇹", count: 30, tier: 1 },
      { id: "bbl", name: "BBL", country: "Alemania", flag: "🇩🇪", count: 18, tier: 1 },
    ],
  }

  // Partidos hardcoded eliminados, ahora usamos el estado 'partidos' cargado desde la API

  const handleBetSelection = (match, type, odds, marketType = "1x2") => {
    const betId = `${match.id}-${type}-${marketType}`
    const existingBetIndex = selectedBets.findIndex(
      (bet) => bet.id === match.id && bet.marketType === marketType,
    )

    if (existingBetIndex >= 0) {
      const existingBet = selectedBets[existingBetIndex]
      const newBets = [...selectedBets]

      if (existingBet.type === type) {
        newBets.splice(existingBetIndex, 1)
        setSelectedBets(newBets)
        toast({
          title: "Apuesta removida",
          description: `${getSelectionName(match, type, marketType)} removida del boleto`,
        })
      } else {
        newBets[existingBetIndex] = {
          id: match.id,
          league: match.liga,
          match: `${match.equipoLocal} vs ${match.equipoVisitante}`,
          type,
          odds,
          selection: getSelectionName(match, type, marketType),
          marketType,
        }
        setSelectedBets(newBets)
        setShowBetSlip(true)
        toast({
          title: "Selección actualizada",
          description: `Cambiada a ${getSelectionName(match, type, marketType)} - Cuota: ${odds}`,
        })
      }
    } else {
      const newBet = {
        id: match.id,
        league: match.liga,
        match: `${match.equipoLocal} vs ${match.equipoVisitante}`,
        type,
        odds,
        selection: getSelectionName(match, type, marketType),
        marketType,
      }
      setSelectedBets([...selectedBets, newBet])
      setShowBetSlip(true)
      toast({
        title: "Apuesta agregada",
        description: `${getSelectionName(match, type, marketType)} - Cuota: ${odds}`,
      })
    }
  }

  const getSelectionName = (match, type, marketType) => {
    if (marketType === "overunder") {
      return type === "over" ? `Más de ${match.overUnder.line}` : `Menos de ${match.overUnder.line}`
    }
    if (marketType === "handicap") {
      return type === "home"
        ? `${match.equipoLocal} ${match.handicap.line}`
        : `${match.equipoVisitante} ${match.handicap.line}`
    }
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

  const isBetSelected = (matchId, type, marketType = "1x2") => {
    return selectedBets.some((bet) => bet.id === matchId && bet.type === type && bet.marketType === marketType)
  }

  const removeBet = (id, type, marketType) => {
    setSelectedBets(
      selectedBets.filter((bet) => !(bet.id === id && bet.type === type && bet.marketType === marketType)),
    )
  }

  const filteredPartidos = partidos.filter((partido) => {
    const matchesSearch =
      partido.equipoLocal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partido.equipoVisitante.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partido.liga.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCountry = selectedCountry === "todos" || partido.pais === selectedCountry
    const matchesLeague = selectedLeague === "todas" || partido.liga === selectedLeague

    return matchesSearch && matchesCountry && matchesLeague
  })

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Apuestas Deportivas</h1>
        <Badge className="bg-green-500 text-white">
          <Zap className="h-3 w-3 mr-1" />
          {filteredPartidos.length} eventos en vivo
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-3 xl:col-span-3 space-y-6 max-w-[280px]">
          {/* Deportes */}
          <Card className="border-2">
            <CardContent className="p-4">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Deportes
              </h2>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {deportes.map((deporte) => (
                  <Link
                    key={deporte.id}
                    href={`/apuestas/${deporte.id}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{deporte.icon}</span>
                      <span className="text-sm font-medium group-hover:text-primary">{deporte.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {deporte.count}
                      </Badge>
                      <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Países */}
          <Card className="border-2">
            <CardContent className="p-4">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Países
              </h2>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {paises.map((pais) => (
                  <Button
                    key={pais.id}
                    variant={selectedCountry === pais.id ? "default" : "ghost"}
                    className="w-full justify-between h-auto py-2"
                    onClick={() => setSelectedCountry(pais.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{pais.flag}</span>
                      <span className="text-xs">{pais.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {pais.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ligas */}
          <Card className="border-2">
            <CardContent className="p-4">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Ligas Principales
              </h2>
              <div className="space-y-2">
                <Button
                  variant={selectedLeague === "todas" ? "default" : "ghost"}
                  className="w-full justify-start text-xs"
                  onClick={() => setSelectedLeague("todas")}
                >
                  Todas las ligas
                </Button>
                {ligas.futbol?.slice(0, 8).map((liga) => (
                  <Button
                    key={liga.id}
                    variant={selectedLeague === liga.name ? "default" : "ghost"}
                    className="w-full justify-between h-auto py-2"
                    onClick={() => setSelectedLeague(liga.name)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs">{liga.flag}</span>
                      <span className="text-xs">{liga.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {liga.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Apuestas Rápidas */}
          <Card className="border-2">
            <CardContent className="p-4">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Acceso Rápido
              </h2>
              <div className="space-y-2">
                <Button className="w-full justify-start" size="sm">
                  <Clock className="h-4 w-4 mr-2" />
                  Partidos de Hoy
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Star className="h-4 w-4 mr-2" />
                  Favoritos
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  En Vivo
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Populares
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-6 xl:col-span-6 space-y-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar equipos, ligas o competiciones..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon" className="shrink-0">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>

              <Tabs defaultValue="todos">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="todos">Todos</TabsTrigger>
                  <TabsTrigger value="hoy">Hoy</TabsTrigger>
                  <TabsTrigger value="directo">En Directo</TabsTrigger>
                  <TabsTrigger value="destacados">Destacados</TabsTrigger>
                </TabsList>

                <TabsContent value="todos" className="mt-6">
                  <div className="space-y-4">
                    {filteredPartidos.map((partido) => (
                      <MatchCard
                        key={partido.id}
                        partido={partido}
                        onBet={handleBetSelection}
                        isBetSelected={isBetSelected}
                      />
                    ))}
                  </div>
                </TabsContent>

                {/* Other tabs with similar structure but filtered content */}
                <TabsContent value="hoy" className="mt-6">
                  <div className="space-y-4">
                    {filteredPartidos
                      .filter((partido) => partido.fecha.includes("Hoy") || partido.fecha.includes("hoy"))
                      .map((partido) => (
                        <MatchCard
                          key={partido.id}
                          partido={partido}
                          onBet={handleBetSelection}
                          isBetSelected={isBetSelected}
                        />
                      ))}
                  </div>
                </TabsContent>

                <TabsContent value="directo" className="mt-6">
                  <div className="space-y-4">
                    {filteredPartidos
                      .filter((partido) => partido.live)
                      .map((partido) => (
                        <MatchCard
                          key={partido.id}
                          partido={partido}
                          onBet={handleBetSelection}
                          isBetSelected={isBetSelected}
                        />
                      ))}
                  </div>
                </TabsContent>

                <TabsContent value="destacados" className="mt-6">
                  <div className="space-y-4">
                    {filteredPartidos
                      .filter((partido) => partido.destacado)
                      .map((partido) => (
                        <MatchCard
                          key={partido.id}
                          partido={partido}
                          onBet={handleBetSelection}
                          isBetSelected={isBetSelected}
                        />
                      ))}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>

        {/* Right Sidebar - Live Chat */}
        <div className="lg:col-span-3 xl:col-span-3 hidden lg:block">
          <LiveChat />
        </div>
      </div>

      {/* Bet Slip */}
      <BetSlip
        open={showBetSlip}
        onOpenChange={setShowBetSlip}
        bets={selectedBets}
        onRemoveBet={removeBet}
        onClearAll={() => setSelectedBets([])}
      />
    </div>
  )
}