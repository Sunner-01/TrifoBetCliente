"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  X, Ticket, Calculator, Trophy, Loader2,
  Trash2, ChevronUp, ChevronDown, Info, Copy
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiPost, apiGet } from "@/lib/api"
import { isAuthenticated } from "@/lib/auth"

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getBetKey = (bet) => `${bet.id}-${bet.type}-${bet.marketType}`

const fmt2 = (n) => (Number.parseFloat(n) || 0).toFixed(2)

const getMarketLabel = (marketType) => {
  const map = {
    "1x2": "Resultado Final",
    "1X2": "Resultado Final",
    resultado: "Resultado Final",
    overunder: "Total de Goles",
    goles: "Total de Goles",
    handicap: "Hándicap",
    doble: "Doble Oportunidad",
    ambos: "Ambos Marcan",
    primer: "Primer Gol",
    tiempo: "Primer Tiempo",
    exacto: "Resultado Exacto",
    corners: "Corners",
    tarjetas: "Tarjetas",
  }
  return map[marketType] || marketType || "Mercado"
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function BetSlip({ open, onOpenChange, bets, onRemoveBet, onClearAll }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [betAmounts, setBetAmounts] = useState({})
  const [combinedAmount, setCombinedAmount] = useState("")
  const [systemAmount, setSystemAmount] = useState("")
  const [activeTab, setActiveTab] = useState("simple") // "simple" | "combinada" | "sistema"
  const [mainTab, setMainTab] = useState("cupon") // "cupon" | "mis-apuestas"
  const [pendingBets, setPendingBets] = useState([])
  const [loadingPending, setLoadingPending] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [shareCode, setShareCode] = useState("")
  const [loadCode, setLoadCode] = useState("")
  const [isLoadingCode, setIsLoadingCode] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const { toast } = useToast()

  const fetchPendingBets = async (silent = false) => {
    if (!isAuthenticated()) return;
    try {
      if (!silent) setLoadingPending(true);
      const data = await apiGet('/apuestas-deportivas/historial?estado=pendiente');
      let historyData = [];
      if (Array.isArray(data)) historyData = data;
      else if (data && typeof data === 'object') historyData = data.apuestas || data.data || data.items || [];
      setPendingBets(historyData.filter(b => b.estado === 'pendiente'));
    } catch (e) {
      console.error("Error fetching pending bets", e);
    } finally {
      if (!silent) setLoadingPending(false);
    }
  }

  // Sincronizar con prop externa (cuando el padre pide abrir/cerrar)
  useEffect(() => {
    if (open !== undefined) setIsExpanded(open)
  }, [open])

  // Polling para mantener apuestas pendientes actualizadas dinámicamente
  useEffect(() => {
    if (mainTab !== "mis-apuestas" || !isExpanded) return;

    fetchPendingBets();

    const interval = setInterval(() => {
      fetchPendingBets(true); // silent fetch
    }, 10000);

    const handleUpdate = () => fetchPendingBets(true);
    window.addEventListener("balance-updated", handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("balance-updated", handleUpdate);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainTab, isExpanded])

  const syncOpen = (val) => {
    setIsExpanded(val)
    if (onOpenChange) onOpenChange(val)
  }

  // Auto-switch de pestaña según cantidad de selecciones
  useEffect(() => {
    if (bets.length === 0) {
      // NO cerramos aquí para que el usuario pueda abrir el cupón vacío y cargar un código
      setActiveTab("simple")
      return
    }
    if (bets.length === 1) {
      setActiveTab("simple")
    } else if (bets.length >= 2) {
      // Pasar auto a combinada
      // Sync primer monto a combinada si está vacío
      if (!combinedAmount && Object.values(betAmounts).length > 0) {
        setCombinedAmount(Object.values(betAmounts)[0])
      }
      setActiveTab("combinada")
    }
    // Abrir automáticamente cuando se agrega la primera apuesta
    if (!isExpanded) {
      setIsExpanded(true)
      if (onOpenChange) onOpenChange(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bets.length])

  // ── Cálculos ──────────────────────────────────────────────────────────────
  const calcPotentialWin = (odds, amount) =>
    fmt2((Number.parseFloat(odds) - 1) * (Number.parseFloat(amount) || 0))

  const calcTotalPayout = (odds, amount) =>
    fmt2(Number.parseFloat(odds) * (Number.parseFloat(amount) || 0))

  const combinedOdds = () =>
    bets.reduce((acc, b) => acc * Number.parseFloat(b.odds), 1).toFixed(2)

  const combinedWin = () =>
    calcPotentialWin(combinedOdds(), combinedAmount)

  const combinedPayout = () =>
    calcTotalPayout(combinedOdds(), combinedAmount)

  const systemCombinations = () =>
    bets.length >= 3 ? Math.floor((bets.length * (bets.length - 1)) / 2) : 0

  const systemTotalCost = () =>
    fmt2((Number.parseFloat(systemAmount) || 0) * systemCombinations())

  // ── Para la barra minimizada ───────────────────────────────────────────────
  const miniOdds = activeTab === "simple" ? "—" : combinedOdds()

  const miniWin = () => {
    if (activeTab === "combinada")
      return `+Bs ${combinedWin()}`
    if (activeTab === "sistema")
      return `Costo: Bs ${systemTotalCost()}`
    // simple: sumar potenciales
    const total = bets.reduce((acc, b) => {
      const key = getBetKey(b)
      return acc + (Number.parseFloat(calcPotentialWin(b.odds, betAmounts[key] || "0")) || 0)
    }, 0)
    return total > 0 ? `+Bs ${total.toFixed(2)}` : "—"
  }

  // ── Validaciones ─────────────────────────────────────────────────────────
  const validateBet = (amount) => {
    if (!isAuthenticated()) {
      window.dispatchEvent(new CustomEvent("open-auth-modal", { detail: { tab: "login" } }))
      toast({ title: "Atención", description: "Inicia sesión para realizar tu apuesta", variant: "default" })
      return false
    }
    const val = Number.parseFloat(amount)
    if (isNaN(val) || val < 2) {
      toast({ title: "Monto inválido", description: "El monto mínimo de apuesta es de 2 Bs.", variant: "destructive" })
      return false
    }
    return true
  }

  // ── Acciones de apuesta ───────────────────────────────────────────────────
  const placeSingleBet = async (bet) => {
    const key = getBetKey(bet)
    const amount = betAmounts[key]
    if (!validateBet(amount)) return
    try {
      setIsSubmitting(true)
      await apiPost("/apuestas-deportivas/crear", {
        tipo: "simple",
        monto: Number.parseFloat(amount),
        selecciones: [{
          eventoId: bet.id,
          mercado: bet.marketType,
          seleccion: bet.type,
          cuota: Number.parseFloat(bet.odds),
          eventoNombre: bet.match,
          seleccionDisplay: bet.selection,
        }],
      })
      toast({ title: "¡Apuesta realizada!", description: `Bs ${amount} en ${bet.selection} · Ganancia potencial: Bs ${calcPotentialWin(bet.odds, amount)}` })
      window.dispatchEvent(new CustomEvent('balance-updated'))
      onRemoveBet(bet.id, bet.type, bet.marketType)
      setBetAmounts((prev) => { const n = { ...prev }; delete n[key]; return n })
    } catch (e) {
      toast({ title: "Error", description: e.message || "Error al procesar la apuesta", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const placeCombinedBet = async () => {
    if (bets.length < 2) {
      toast({ title: "Error", description: "Necesitas al menos 2 selecciones para una combinada", variant: "destructive" })
      return
    }
    if (!validateBet(combinedAmount)) return
    try {
      setIsSubmitting(true)
      await apiPost("/apuestas-deportivas/crear", {
        tipo: "combinada",
        monto: Number.parseFloat(combinedAmount),
        selecciones: bets.map((b) => ({
          eventoId: b.id,
          mercado: b.marketType,
          seleccion: b.type,
          cuota: Number.parseFloat(b.odds),
          eventoNombre: b.match,
          seleccionDisplay: b.selection,
        })),
      })
      toast({ title: "¡Combinada realizada!", description: `Bs ${combinedAmount} · Cuota total: ${combinedOdds()} · Ganancia potencial: Bs ${combinedWin()}` })
      window.dispatchEvent(new CustomEvent('balance-updated'))
      clearAll()
    } catch (e) {
      toast({ title: "Error", description: e.message || "Error al procesar la apuesta", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const placeSystemBet = async () => {
    if (bets.length < 3) return
    if (!validateBet(systemAmount)) return
    try {
      setIsSubmitting(true)
      await apiPost("/apuestas-deportivas/crear", {
        tipo: "sistema",
        monto: Number.parseFloat(systemAmount),
        selecciones: bets.map((b) => ({
          eventoId: b.id,
          mercado: b.marketType,
          seleccion: b.type,
          cuota: Number.parseFloat(b.odds),
          eventoNombre: b.match,
          seleccionDisplay: b.selection,
        })),
      })
      toast({ title: "¡Sistema realizado!", description: `${systemCombinations()} combinaciones · Inversión total: Bs ${systemTotalCost()}` })
      window.dispatchEvent(new CustomEvent('balance-updated'))
      clearAll()
    } catch (e) {
      toast({ title: "Error", description: e.message || "Error al procesar la apuesta", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const clearAll = () => {
    if (onClearAll) onClearAll()
    else bets.forEach((b) => onRemoveBet(b.id, b.type, b.marketType))
    setBetAmounts({})
    setCombinedAmount("")
    setSystemAmount("")
    setShareCode("")
    syncOpen(false)
  }

  const handleShareSlip = async () => {
    try {
      setIsSubmitting(true)
      const res = await apiPost("/cupon/compartir", { selecciones: bets })
      if (res && res.codigo) {
        setShareCode(res.codigo)
        navigator.clipboard.writeText(res.codigo)
        toast({ title: "Cupón Compartido", description: `Código copiado al portapapeles: ${res.codigo}` })
      }
    } catch (e) {
      toast({ title: "Error", description: e.message || "No se pudo compartir el cupón", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLoadSlip = async () => {
    if (!loadCode) return
    try {
      setIsLoadingCode(true)
      const res = await apiGet(`/cupon/${loadCode.trim()}`)
      if (res && Array.isArray(res)) {
        // En una implementación real, aquí reemplazaríamos o combinaríamos 'bets'.
        // Como 'selectedBets' se maneja en el padre, necesitamos disparar eventos
        // o manejarlo adecuadamente. Por ahora, como 'onRemoveBet' se pasa, no tenemos
        // un 'onAddBets'. Para hacerlo profesional, esto debería hacerse en el padre, 
        // pero podemos disparar un evento global.
        window.dispatchEvent(new CustomEvent("load-bets", { detail: { bets: res } }))
        toast({ title: "Cupón Cargado", description: "Selecciones añadidas exitosamente" })
        setLoadCode("")
      }
    } catch (e) {
      toast({ title: "Error", description: e.message || "Código inválido o expirado", variant: "destructive" })
    } finally {
      setIsLoadingCode(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const groupedBetsArray = Object.values(
    bets.reduce((acc, bet) => {
      const matchName = bet.match || bet.league;
      if (!acc[matchName]) acc[matchName] = { matchName, id: bet.id, bets: [] };
      acc[matchName].bets.push(bet);
      return acc;
    }, {})
  );

  return (
    <div className="fixed bottom-0 right-0 z-50 w-full sm:w-[360px] flex flex-col pointer-events-none">
      {/* pointer-events-none en el wrapper para que los hijos lo anulen individualmente */}

      {/* ── PANEL EXPANDIDO ── */}
      {isExpanded && (
        <div className="pointer-events-auto flex flex-col bg-card border border-border rounded-t-2xl sm:rounded-2xl sm:mb-2 shadow-2xl max-h-[80vh] overflow-hidden">

          {/* Cabecera y Tabs principales */}
          <div className="flex flex-col border-b bg-muted/30 rounded-t-2xl sm:rounded-t-2xl">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-primary" />
                <span className="font-bold text-sm">Apuestas Deportivas</span>
                <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground">
                  {bets.length}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={clearAll} title="Limpiar todo">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => syncOpen(false)}>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {/* Main Tabs */}
            <div className="flex gap-1 px-2 pb-2">
              <button
                onClick={() => setMainTab("cupon")}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  mainTab === "cupon"
                    ? "bg-background shadow text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                Cupón ({bets.length})
              </button>
              <button
                onClick={() => {
                  setMainTab("mis-apuestas")
                  fetchPendingBets()
                }}
                className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  mainTab === "mis-apuestas"
                    ? "bg-background shadow text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                Mis Apuestas
              </button>
            </div>
          </div>

          {/* Selector de tipo — solo si hay 3+ selecciones */}
          {mainTab === "cupon" && bets.length >= 3 && (
            <div className="flex gap-1 p-2 border-b bg-muted/10">
              {["combinada", "sistema"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors capitalize ${activeTab === tab
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"}`}
                >
                  {tab === "combinada" ? "Combinada" : "Sistema"}
                </button>
              ))}
            </div>
          )}

          {/* Opciones de Compartir / Cargar */}
          {mainTab === "cupon" && (
            <div className="flex flex-col gap-2 p-3 border-b bg-card">
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="Código ej. A7B9X"
                  value={loadCode}
                  onChange={(e) => setLoadCode(e.target.value.toUpperCase())}
                  className="h-8 text-xs font-mono uppercase"
                />
                <Button size="sm" variant="secondary" className="h-8 shrink-0 text-xs" onClick={handleLoadSlip} disabled={isLoadingCode || !loadCode}>
                  {isLoadingCode ? <Loader2 className="h-3 w-3 animate-spin" /> : "Cargar"}
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={handleShareSlip}
                  disabled={bets.length === 0 || isSubmitting}
                >
                  <Ticket className="h-3.5 w-3.5 mr-1" />
                  Guardar selección
                </Button>
                {shareCode && (
                  <div className="flex items-center gap-1 relative">
                    {isCopied && (
                      <div className="absolute -top-8 right-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded shadow-lg animate-in fade-in zoom-in duration-200 whitespace-nowrap z-50">
                        ¡Copiado!
                      </div>
                    )}
                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded select-all cursor-pointer">
                      {shareCode}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 transition-colors text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        try {
                          navigator.clipboard.writeText(shareCode)
                            .then(() => {
                              setIsCopied(true)
                              setTimeout(() => setIsCopied(false), 2000)
                            })
                            .catch(() => {
                              const el = document.createElement("textarea")
                              el.value = shareCode
                              document.body.appendChild(el)
                              el.select()
                              document.execCommand("copy")
                              document.body.removeChild(el)
                              setIsCopied(true)
                              setTimeout(() => setIsCopied(false), 2000)
                            })
                        } catch (e) {
                          toast({ title: "Error", description: "No se pudo copiar el código", variant: "destructive" })
                        }
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="p-3 space-y-3">

              {/* ──── MENSAJE VACÍO ──── */}
              {mainTab === "cupon" && bets.length === 0 && (
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 opacity-60">
                  <Ticket className="h-12 w-12 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">Tu cupón está vacío</p>
                  <p className="text-xs text-muted-foreground">Selecciona alguna cuota para comenzar o carga un código arriba.</p>
                </div>
              )}

              {/* ──── VISTA: SIMPLE ──── */}
              {mainTab === "cupon" && activeTab === "simple" && bets.length > 0 && bets.map((bet) => {
                const key = getBetKey(bet)
                const amount = betAmounts[key] || ""
                const payout = calcTotalPayout(bet.odds, amount)

                return (
                  <div key={key} className="border border-border rounded-xl overflow-hidden bg-card">
                    {/* Bet info row */}
                    <div className="flex items-start justify-between p-3 gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-muted-foreground truncate mb-0.5">
                          {bet.match || bet.league}
                        </p>
                        <p className="text-sm font-bold truncate">{bet.selection}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {getMarketLabel(bet.marketType)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-base font-black text-primary">{bet.odds}</span>
                        <button
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          onClick={() => onRemoveBet(bet.id, bet.type, bet.marketType)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Stake input */}
                    <div className="px-3 pb-3 space-y-2 bg-muted/20 border-t border-border/50">
                      <div className="flex items-center justify-between pt-2">
                        <Label className="text-[11px] text-muted-foreground">Monto a apostar (Bs)</Label>
                        <Input
                          type="number"
                          value={amount}
                          onChange={(e) => setBetAmounts((p) => ({ ...p, [key]: e.target.value }))}
                          className="w-24 h-8 text-right text-sm font-bold border-2 border-green-500 rounded-md focus-visible:ring-green-500 bg-background"
                          placeholder="2.00"
                          min="2"
                          step="0.01"
                        />
                      </div>
                      {/* Quick amounts */}
                      <div className="flex gap-1">
                        {[5, 10, 25, 50].map((v) => (
                          <button
                            key={v}
                            onClick={() => setBetAmounts((p) => ({ ...p, [key]: String(v) }))}
                            className="flex-1 py-1 rounded-md bg-muted hover:bg-muted/70 text-xs font-semibold text-foreground transition-colors"
                          >
                            +{v}
                          </button>
                        ))}
                      </div>

                      {/* Error validación */}
                      {amount && Number.parseFloat(amount) < 2 && (
                        <p className="text-[10px] text-destructive font-semibold pt-1">
                          El monto mínimo de apuesta es 2 Bs.
                        </p>
                      )}

                      {/* Retorno */}
                      {amount && Number.parseFloat(amount) > 0 && (
                        <div className="flex justify-between items-center text-xs pt-1 border-t border-border/40">
                          <span className="text-muted-foreground">Retorno estimado</span>
                          <span className="font-black text-primary">Bs {payout}</span>
                        </div>
                      )}
                    </div>

                    {/* Bet button */}
                    <div className="px-3 pb-3 pt-2">
                      <Button
                        className="w-full h-9 font-bold text-sm"
                        onClick={() => placeSingleBet(bet)}
                        disabled={!amount || Number.parseFloat(amount) < 2 || isSubmitting}
                      >
                        {isSubmitting
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : `Apostar Bs ${amount || "0"}`}
                      </Button>
                    </div>
                  </div>
                )
              })}

              {/* ──── VISTA: COMBINADA (auto cuando bets >= 2) ──── */}
              {mainTab === "cupon" && activeTab === "combinada" && (
                <div className="space-y-2">
                  {/* Lista de selecciones agrupadas */}
                  <div className="space-y-3">
                    {groupedBetsArray.map((group) => (
                      <div key={group.matchName} className="border border-border/60 rounded-lg overflow-hidden bg-card">
                        <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 border-b border-border/40">
                          <span className="text-[11px] font-bold truncate text-muted-foreground">
                            {group.matchName}
                          </span>
                          <button
                            className="text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => group.bets.forEach((b) => onRemoveBet(b.id, b.type, b.marketType))}
                            title="Quitar selecciones de este evento"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="divide-y divide-border/30">
                          {group.bets.map((bet) => (
                            <div key={getBetKey(bet)} className="flex items-center gap-2 p-2 px-3 bg-muted/10">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold truncate text-foreground">{bet.selection}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{getMarketLabel(bet.marketType)}</p>
                              </div>
                              <span className="text-sm font-black text-primary shrink-0">{bet.odds}</span>
                              <button
                                className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                                onClick={() => onRemoveBet(bet.id, bet.type, bet.marketType)}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Panel de cuota combinada + stake */}
                  <div className="border border-border rounded-xl bg-card overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/60">
                      <span className="text-xs text-muted-foreground font-medium">
                        Cuota Total ({bets.length} selecciones)
                      </span>
                      <span className="text-xl font-black text-primary">{combinedOdds()}</span>
                    </div>

                    <div className="p-3 space-y-2 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px] text-muted-foreground">Monto Combinada (Bs)</Label>
                        <Input
                          type="number"
                          value={combinedAmount}
                          onChange={(e) => setCombinedAmount(e.target.value)}
                          className="w-24 h-8 text-right text-sm font-bold border-2 border-green-500 rounded-md focus-visible:ring-green-500 bg-background"
                          placeholder="2.00"
                          min="2"
                          step="0.01"
                        />
                      </div>
                      <div className="flex gap-1">
                        {[5, 10, 25, 50].map((v) => (
                          <button
                            key={v}
                            onClick={() => setCombinedAmount(String(v))}
                            className="flex-1 py-1 rounded-md bg-muted hover:bg-muted/70 text-xs font-semibold transition-colors"
                          >
                            +{v}
                          </button>
                        ))}
                      </div>

                      {/* Error validación */}
                      {combinedAmount && Number.parseFloat(combinedAmount) < 2 && (
                        <p className="text-[10px] text-destructive font-semibold">
                          El monto mínimo de apuesta es 2 Bs.
                        </p>
                      )}

                      {combinedAmount && Number.parseFloat(combinedAmount) >= 2 && (
                        <div className="space-y-1 pt-1 border-t border-border/40">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-muted-foreground">Ganancia potencial</span>
                            <span className="font-semibold text-primary">+Bs {combinedWin()}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground font-medium">Retorno total</span>
                            <span className="font-black text-primary">Bs {combinedPayout()}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="px-3 pb-3 pt-1">
                      <Button
                        className="w-full h-10 font-bold"
                        onClick={placeCombinedBet}
                        disabled={!combinedAmount || Number.parseFloat(combinedAmount) < 2 || isSubmitting}
                      >
                        {isSubmitting
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : `Apostar Combinada · Bs ${combinedAmount || "0"}`}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* ──── VISTA: SISTEMA ──── */}
              {mainTab === "cupon" && activeTab === "sistema" && bets.length >= 3 && (
                <div className="space-y-2">
                  {/* Info del sistema */}
                  <div className="flex gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-primary">Sistema 2/{bets.length}</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Se generan <strong className="text-foreground">{systemCombinations()} combinaciones</strong> de 2 selecciones.
                        Ganas retorno si al menos 2 de tus selecciones son correctas.
                      </p>
                    </div>
                  </div>

                  {/* Lista de selecciones agrupadas */}
                  <div className="space-y-3">
                    {groupedBetsArray.map((group) => (
                      <div key={group.matchName} className="border border-border/60 rounded-lg overflow-hidden bg-card">
                        <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 border-b border-border/40">
                          <span className="text-[11px] font-bold truncate text-muted-foreground">
                            {group.matchName}
                          </span>
                          <button
                            className="text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => group.bets.forEach((b) => onRemoveBet(b.id, b.type, b.marketType))}
                            title="Quitar selecciones de este evento"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="divide-y divide-border/30">
                          {group.bets.map((bet) => (
                            <div key={getBetKey(bet)} className="flex items-center gap-2 p-2 px-3 bg-muted/10">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold truncate text-foreground">{bet.selection}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{getMarketLabel(bet.marketType)}</p>
                              </div>
                              <span className="text-sm font-black text-primary shrink-0">{bet.odds}</span>
                              <button
                                className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                                onClick={() => onRemoveBet(bet.id, bet.type, bet.marketType)}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Stake */}
                  <div className="border border-border rounded-xl bg-card overflow-hidden">
                    <div className="p-3 space-y-2 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px] text-muted-foreground">Monto por línea (Bs)</Label>
                        <Input
                          type="number"
                          value={systemAmount}
                          onChange={(e) => setSystemAmount(e.target.value)}
                          className="w-24 h-8 text-right text-sm font-bold border-2 border-green-500 rounded-md focus-visible:ring-green-500 bg-background"
                          placeholder="2.00"
                          min="2"
                          step="0.01"
                        />
                      </div>
                      
                      {/* Error validación */}
                      {systemAmount && Number.parseFloat(systemAmount) < 2 && (
                        <p className="text-[10px] text-destructive font-semibold">
                          El monto mínimo de apuesta es 2 Bs.
                        </p>
                      )}

                      {systemAmount && Number.parseFloat(systemAmount) >= 2 && (
                        <div className="flex justify-between text-xs pt-1 border-t border-border/40">
                          <span className="text-muted-foreground">
                            {systemCombinations()} combinaciones · costo total
                          </span>
                          <span className="font-black text-foreground">Bs {systemTotalCost()}</span>
                        </div>
                      )}
                    </div>
                    <div className="px-3 pb-3 pt-1">
                      <Button
                        className="w-full h-10 font-bold"
                        onClick={placeSystemBet}
                        disabled={!systemAmount || Number.parseFloat(systemAmount) < 2 || isSubmitting}
                      >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Colocar Sistema"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {/* ──── VISTA: MIS APUESTAS PENDIENTES ──── */}
              {mainTab === "mis-apuestas" && (
                <div className="space-y-3 p-3">
                  {loadingPending ? (
                    <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                  ) : pendingBets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 opacity-60">
                      <Ticket className="h-12 w-12 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">Sin apuestas pendientes</p>
                      <Button variant="outline" size="sm" onClick={() => window.dispatchEvent(new CustomEvent('open-bet-history'))}>
                        Ver Historial Completo
                      </Button>
                    </div>
                  ) : (
                    <>
                      {pendingBets.map(bet => (
                        <div key={bet.id} className="border border-border rounded-xl overflow-hidden bg-card text-xs">
                          <div className="flex justify-between items-center bg-muted/40 px-3 py-2 border-b">
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{bet.tipo === 'combinada' ? 'Combinada' : bet.tipo === 'sistema' ? 'Sistema' : 'Simple'}</span>
                              <span className="text-[10px] font-mono text-muted-foreground">{`TRF-${String(bet.id).padStart(8, "0")}`}</span>
                            </div>
                            <Badge variant="secondary" className="text-[10px] bg-yellow-500/10 text-yellow-600">Pendiente</Badge>
                          </div>
                          <div className="p-3 space-y-2">
                            {bet.selecciones?.slice(0, 2).map((s, i) => (
                              <div key={i} className="flex justify-between truncate text-[11px]">
                                <span className="truncate mr-2 font-medium">{s.seleccionDisplay}</span>
                                <span className="font-mono text-primary font-bold">{Number(s.cuota).toFixed(2)}</span>
                              </div>
                            ))}
                            {bet.selecciones?.length > 2 && (
                              <div className="text-[10px] text-muted-foreground">
                                +{bet.selecciones.length - 2} selecciones más...
                              </div>
                            )}
                            <div className="flex justify-between border-t border-border/50 pt-2 mt-2 font-semibold">
                              <span>Monto: Bs {Number(bet.monto).toFixed(2)}</span>
                              <span className="text-primary">Potencial: Bs {Number(bet.gananciaPotencial || 0).toFixed(2)}</span>
                            </div>
                            <div className="pt-2 mt-2 border-t flex justify-between items-center">
                              <span className="text-[10px] text-muted-foreground">Retorno: Bs {(Number(bet.monto) * 0.85).toFixed(2)}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] bg-primary text-primary-foreground hover:bg-primary/90"
                                onClick={async () => {
                                  try {
                                    const res = await apiPost(`/apuestas-deportivas/${bet.id}/cashout`);
                                    toast({ title: "Cerrada", description: `Has recuperado Bs ${res.montoDevuelto.toFixed(2)}` });
                                    fetchPendingBets();
                                    window.dispatchEvent(new CustomEvent('balance-updated'));
                                  } catch (e) {
                                    toast({ title: "Error", description: e.message || "No se pudo cerrar", variant: "destructive" });
                                  }
                                }}
                              >
                                Cashout
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" className="w-full text-xs" onClick={() => window.dispatchEvent(new CustomEvent('open-bet-history'))}>
                        Ver Historial Completo
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* ── BARRA MINIMIZADA ── */}
      {!isExpanded && (
        <button
          onClick={() => syncOpen(true)}
          style={{
            backgroundColor: '#1e2329',
            isolation: 'isolate',
          }}
          className="pointer-events-auto flex items-center justify-between gap-3 w-full px-4 py-3
            border border-white/10 rounded-t-2xl sm:rounded-2xl sm:mb-2
            shadow-[0_-8px_32px_rgba(0,0,0,0.5)] hover:brightness-110 active:brightness-90 transition-all text-left
            relative z-10"
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-black">
              {bets.length}
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">
                {bets.length === 0 ? "Cupón" : bets.length === 1 ? "Apuesta Simple" : activeTab === "sistema" ? "Apuesta de Sistema" : "Apuesta Combinada"}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Toca para ver o cargar código
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {bets.length >= 2 && (
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground leading-tight">Cuota</p>
                <p className="text-sm font-black text-primary leading-tight">{miniOdds}</p>
              </div>
            )}
            {bets.length > 0 && (
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground leading-tight">Potencial</p>
                <p className="text-xs font-black text-primary leading-tight">{miniWin()}</p>
              </div>
            )}
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          </div>
        </button>
      )}
    </div>
  )
}