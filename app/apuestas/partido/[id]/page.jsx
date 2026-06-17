"use client";

import { useState, useEffect, use } from "react";
import {
  ArrowLeft,
  Clock,
  Target,
  TrendingUp,
  Star,
  Loader2,
  Radio,
  Shield,
  Trophy,
  Flag,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import BetSlip from "@/components/bet-slip";
import { LiveChat } from "@/components/live-chat";
import { useToast } from "@/hooks/use-toast";
import { apiGet } from "@/lib/api";

function OddsButton({ label, sublabel, odds, selected, onClick }) {
  if (!odds || odds === "-") return null;
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-2.5 border transition-all duration-200 font-medium w-full
        ${selected
          ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/25 scale-[1.02]"
          : "bg-secondary/40 border-border/60 shadow-sm hover:border-primary/50 hover:bg-secondary/80 text-foreground"
        }`}
    >
      {sublabel && <span className="text-[9px] uppercase tracking-wide opacity-60 font-medium">{sublabel}</span>}
      <span className="text-[11px] font-medium opacity-75">{label}</span>
      <span className="text-base font-bold">{odds}</span>
    </button>
  );
}

function MarketSection({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-muted/30 border-b border-border hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {Icon && <Icon className="h-4 w-4 text-primary" />}
          <span className="text-sm font-semibold">{title}</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="p-5">{children}</div>}
    </div>
  );
}

const MARKET_TABS = [
  { id: "resultado", label: "Resultado" },
  { id: "goles", label: "Goles" },
  { id: "handicap", label: "Handicap" },
  { id: "ambos", label: "Ambos Marcan" },
  { id: "tiempo", label: "1er Tiempo" },
  { id: "exacto", label: "Exacto" },
  { id: "corners", label: "Corners" },
  { id: "tarjetas", label: "Tarjetas" },
];

export default function PartidoDetallePage({ params }) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const [activeTab, setActiveTab] = useState("resultado");
  const [showBetSlip, setShowBetSlip] = useState(false);
  const [selectedBets, setSelectedBets] = useState([]);
  const { toast } = useToast();
  const [partido, setPartido] = useState(null);
  const [mercados, setMercados] = useState({
    resultado: [],
    totalGoles: [],
    handicap: [],
    ambosMarcan: [],
    primerGol: [],
    mitadTiempo: [],
    dobleOportunidad: [],
    resultadoExacto: [],
    corners: [],
    tarjetas: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleLoadBets = (e) => {
      if (e.detail?.bets) { setSelectedBets(e.detail.bets); setShowBetSlip(true); }
    };
    window.addEventListener("load-bets", handleLoadBets);
    return () => window.removeEventListener("load-bets", handleLoadBets);
  }, []);

  useEffect(() => {
    const fetchPartido = async () => {
      try {
        setLoading(true);
        const data = await apiGet('/deportes/futbol/partidos');
        let todosLosPartidos = [];
        if (Array.isArray(data)) {
          todosLosPartidos = data;
        } else if (typeof data === 'object' && data !== null) {
          Object.values(data).forEach(arr => {
            if (Array.isArray(arr)) todosLosPartidos = [...todosLosPartidos, ...arr];
          });
        }

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

        const matchFound = todosLosPartidos.find(p => p.id.toString() === id);
        if (matchFound) {
          setPartido({
            id: matchFound.id,
            equipoLocal: matchFound.equipo_local,
            equipoVisitante: matchFound.equipo_visitante,
            logoLocal: matchFound.escudo_local,
            logoVisitante: matchFound.escudo_visitante,
            liga: matchFound.liga,
            fecha: formatearFecha(matchFound.fecha),
            estadio: "Estadio Principal",
            live: matchFound.estado !== "NS",
            marcadorLocal: matchFound.goles_local || 0,
            marcadorVisitante: matchFound.goles_visitante || 0,
            minuto: matchFound.minuto || null,
            estado: matchFound.estado,
          });

          const cuotas = matchFound.cuotas || {};
          const main = cuotas.main || {};
          const goals = cuotas.goals || {};
          const newMercados = { resultado: [], totalGoles: [], handicap: [], ambosMarcan: [], primerGol: [], mitadTiempo: [], dobleOportunidad: [], resultadoExacto: [], corners: [], tarjetas: [] };

          if (main["1X2"]) {
            newMercados.resultado = [
              { name: `1 - ${matchFound.equipo_local}`, odds: main["1X2"]["1"]?.toFixed(2) || "-", type: "1" },
              { name: "X - Empate", odds: main["1X2"]["X"]?.toFixed(2) || "-", type: "X" },
              { name: `2 - ${matchFound.equipo_visitante}`, odds: main["1X2"]["2"]?.toFixed(2) || "-", type: "2" },
            ];
          }

          if (main.double_chance) {
            newMercados.dobleOportunidad = [
              { name: "1X", odds: main.double_chance["1X"]?.toFixed(2) || "-", type: "1X" },
              { name: "12", odds: main.double_chance["12"]?.toFixed(2) || "-", type: "12" },
              { name: "X2", odds: main.double_chance["X2"]?.toFixed(2) || "-", type: "X2" },
            ];
          }

          if (goals.total) {
            Object.keys(goals.total).forEach(line => {
              newMercados.totalGoles.push(
                { name: `Mas de ${line}`, odds: goals.total[line].over?.toFixed(2) || "-", type: `over_${line}`, sublabel: `+ ${line}` },
                { name: `Menos de ${line}`, odds: goals.total[line].under?.toFixed(2) || "-", type: `under_${line}`, sublabel: `- ${line}` }
              );
            });
          }

          if (goals.both_teams) {
            newMercados.ambosMarcan = [
              { name: "Si", odds: goals.both_teams.yes?.toFixed(2) || "-", type: "btts_yes" },
              { name: "No", odds: goals.both_teams.no?.toFixed(2) || "-", type: "btts_no" },
            ];
          }

          setMercados(newMercados);
        } else {
          setError("Partido no encontrado");
        }
      } catch (err) {
        setError("Error al cargar los detalles del partido");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchPartido();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground">Cargando mercados...</span>
      </div>
    );
  }

  if (error || !partido) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-lg font-semibold">{error || "Partido no encontrado"}</p>
        <Link href="/apuestas" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
          <ArrowLeft className="h-4 w-4" />
          Volver a Apuestas
        </Link>
      </div>
    );
  }

  const handleBetSelection = (market, bet) => {
    const existingBetIndex = selectedBets.findIndex(
      (selectedBet) => selectedBet.id === partido.id && selectedBet.marketType === market
    );

    if (existingBetIndex >= 0) {
      const existingBet = selectedBets[existingBetIndex];
      const newBets = [...selectedBets];
      if (existingBet.type === bet.type) {
        newBets.splice(existingBetIndex, 1);
        setSelectedBets(newBets);
        toast({ title: "Apuesta removida", description: `${bet.name} removida del boleto` });
      } else {
        newBets[existingBetIndex] = {
          id: partido.id, league: partido.liga, match: `${partido.equipoLocal} vs ${partido.equipoVisitante}`,
          type: bet.type, odds: bet.odds, selection: bet.name, marketType: market,
        };
        setSelectedBets(newBets);
        setShowBetSlip(true);
        toast({ title: "Seleccion actualizada", description: `${bet.name} - Cuota: ${bet.odds}` });
      }
    } else {
      setSelectedBets([...selectedBets, {
        id: partido.id, league: partido.liga, match: `${partido.equipoLocal} vs ${partido.equipoVisitante}`,
        type: bet.type, odds: bet.odds, selection: bet.name, marketType: market,
      }]);
      setShowBetSlip(true);
      toast({ title: "Apuesta agregada", description: `${bet.name} - Cuota: ${bet.odds}` });
    }
  };

  const isBetSelected = (market, betType) =>
    selectedBets.some((bet) => bet.id === partido.id && bet.type === betType && bet.marketType === market);

  const removeBet = (id, type, marketType) =>
    setSelectedBets(selectedBets.filter((bet) => !(bet.id === id && bet.type === type && bet.marketType === marketType)));

  const renderActiveMarket = () => {
    switch (activeTab) {
      case "resultado":
        return (
          <div className="space-y-4">
            <MarketSection title="Resultado Final" icon={Target}>
              {mercados.resultado.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {mercados.resultado.map((bet) => (
                    <OddsButton
                      key={bet.type}
                      label={bet.name}
                      odds={bet.odds}
                      selected={isBetSelected("resultado", bet.type)}
                      onClick={() => handleBetSelection("resultado", bet)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Sin cuotas disponibles</p>
              )}
            </MarketSection>

            {mercados.dobleOportunidad.length > 0 && (
              <MarketSection title="Doble Oportunidad" icon={Shield}>
                <div className="grid grid-cols-3 gap-3">
                  {mercados.dobleOportunidad.map((bet) => (
                    <OddsButton
                      key={bet.type}
                      label={bet.name}
                      odds={bet.odds}
                      selected={isBetSelected("doble", bet.type)}
                      onClick={() => handleBetSelection("doble", bet)}
                    />
                  ))}
                </div>
              </MarketSection>
            )}
          </div>
        );

      case "goles":
        return (
          <div className="space-y-4">
            <MarketSection title="Total de Goles" icon={TrendingUp}>
              {mercados.totalGoles.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {mercados.totalGoles.map((bet) => (
                    <OddsButton
                      key={bet.type}
                      label={bet.name}
                      sublabel={bet.sublabel}
                      odds={bet.odds}
                      selected={isBetSelected("goles", bet.type)}
                      onClick={() => handleBetSelection("goles", bet)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Sin cuotas disponibles</p>
              )}
            </MarketSection>
          </div>
        );

      case "ambos":
        return (
          <MarketSection title="Ambos Equipos Marcan" icon={Trophy}>
            {mercados.ambosMarcan.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 max-w-xs">
                {mercados.ambosMarcan.map((bet) => (
                  <OddsButton
                    key={bet.type}
                    label={bet.name}
                    odds={bet.odds}
                    selected={isBetSelected("ambos", bet.type)}
                    onClick={() => handleBetSelection("ambos", bet)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Sin cuotas disponibles</p>
            )}
          </MarketSection>
        );

      case "handicap":
        return (
          <MarketSection title="Handicap Asiatico" icon={TrendingUp}>
            {mercados.handicap.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {mercados.handicap.map((bet) => (
                  <OddsButton
                    key={bet.type}
                    label={bet.name}
                    odds={bet.odds}
                    selected={isBetSelected("handicap", bet.type)}
                    onClick={() => handleBetSelection("handicap", bet)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Sin cuotas disponibles para este mercado</p>
            )}
          </MarketSection>
        );

      case "tiempo":
        return (
          <MarketSection title="Primer Tiempo" icon={Clock}>
            {mercados.mitadTiempo.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {mercados.mitadTiempo.map((bet) => (
                  <OddsButton
                    key={bet.type}
                    label={bet.name}
                    odds={bet.odds}
                    selected={isBetSelected("tiempo", bet.type)}
                    onClick={() => handleBetSelection("tiempo", bet)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Sin cuotas disponibles para este mercado</p>
            )}
          </MarketSection>
        );

      case "exacto":
        return (
          <MarketSection title="Resultado Exacto" icon={Star}>
            {mercados.resultadoExacto.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {mercados.resultadoExacto.map((bet) => (
                  <OddsButton
                    key={bet.type}
                    label={bet.name}
                    odds={bet.odds}
                    selected={isBetSelected("exacto", bet.type)}
                    onClick={() => handleBetSelection("exacto", bet)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Sin cuotas disponibles para este mercado</p>
            )}
          </MarketSection>
        );

      case "corners":
        return (
          <MarketSection title="Corners" icon={Flag}>
            {mercados.corners.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {mercados.corners.map((bet) => (
                  <OddsButton
                    key={bet.type}
                    label={bet.name}
                    odds={bet.odds}
                    selected={isBetSelected("corners", bet.type)}
                    onClick={() => handleBetSelection("corners", bet)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Sin cuotas disponibles para este mercado</p>
            )}
          </MarketSection>
        );

      case "tarjetas":
        return (
          <MarketSection title="Tarjetas" icon={AlertCircle}>
            {mercados.tarjetas.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {mercados.tarjetas.map((bet) => (
                  <OddsButton
                    key={bet.type}
                    label={bet.name}
                    odds={bet.odds}
                    selected={isBetSelected("tarjetas", bet.type)}
                    onClick={() => handleBetSelection("tarjetas", bet)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Sin cuotas disponibles para este mercado</p>
            )}
          </MarketSection>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 py-6 max-w-[1400px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Content (Match Details & Markets) */}
        <div className="lg:col-span-9 space-y-6">
          <div className="flex items-center gap-3">
            <Link
              href="/apuestas"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
            <div>
              <h1 className="text-xl font-bold">Mercados de Apuestas</h1>
              <p className="text-xs text-muted-foreground">{partido.liga}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-6 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Trophy className="h-3.5 w-3.5 text-primary/70" />
                {partido.liga}
              </span>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {partido.live && (
                  <span className="flex items-center gap-1.5 text-red-500 font-bold text-[10px] bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 uppercase">
                    <Radio className="h-3 w-3 animate-pulse" />
                    EN VIVO
                  </span>
                )}
              </div>
            </div>

            <div className="px-6 py-8">
              <div className="flex items-center justify-between gap-6 max-w-2xl mx-auto">
                <div className="flex flex-col items-center gap-3 flex-1">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-muted flex items-center justify-center overflow-hidden border border-border">
                    <Image src={partido.logoLocal || "/placeholder.svg"} alt={partido.equipoLocal} width={72} height={72} className="object-contain" />
                  </div>
                  <span className="font-bold text-center text-sm sm:text-base leading-tight">{partido.equipoLocal}</span>
                  <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded">Local</span>
                </div>

                <div className="flex flex-col items-center justify-center px-2 flex-shrink-0 min-w-[100px]">
                  <div className="text-xs font-bold text-muted-foreground mb-2 whitespace-nowrap bg-muted/50 px-3 py-1 rounded-full uppercase">
                    {partido.live ? (
                      <span className="text-red-500 flex items-center gap-1.5"><Clock className="h-3 w-3"/>{partido.minuto}'</span>
                    ) : (
                      <span>{partido.fecha}</span>
                    )}
                  </div>
                  
                  {partido.live ? (
                    <div className="text-4xl sm:text-5xl font-black tabular-nums text-primary tracking-tighter">
                      {partido.marcadorLocal} - {partido.marcadorVisitante}
                    </div>
                  ) : (
                    <div className="text-2xl sm:text-3xl font-black text-muted-foreground/50">VS</div>
                  )}
                </div>

                <div className="flex flex-col items-center gap-3 flex-1">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-muted flex items-center justify-center overflow-hidden border border-border">
                    <Image src={partido.logoVisitante || "/placeholder.svg"} alt={partido.equipoVisitante} width={72} height={72} className="object-contain" />
                  </div>
                  <span className="font-bold text-center text-sm sm:text-base leading-tight">{partido.equipoVisitante}</span>
                  <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded">Visitante</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-border bg-muted/20 flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5" />{partido.estadio}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide">
              {MARKET_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border
                    ${activeTab === tab.id
                      ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/25"
                      : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {renderActiveMarket()}
          </div>
        </div>

        {/* Sidebar (Live Chat) */}
        <div className="hidden lg:block lg:col-span-3">
          <div className="sticky top-6">
            <LiveChat />
          </div>
        </div>
      </div>

      {selectedBets.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 lg:hidden">
          <button
            onClick={() => setShowBetSlip(true)}
            className="flex items-center gap-3 px-6 py-3 bg-primary text-primary-foreground rounded-2xl shadow-xl shadow-primary/30 font-bold text-sm"
          >
            <Target className="h-4 w-4" />
            <span>Ver Boleto</span>
            <span className="bg-primary-foreground/20 text-primary-foreground text-xs font-black px-2 py-0.5 rounded-full">
              {selectedBets.length}
            </span>
          </button>
        </div>
      )}

      <BetSlip
        open={showBetSlip}
        onOpenChange={setShowBetSlip}
        bets={selectedBets}
        onRemoveBet={removeBet}
        onClearAll={() => setSelectedBets([])}
      />
    </div>
  );
}