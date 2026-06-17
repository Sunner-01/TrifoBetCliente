"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Play } from "lucide-react";
import { motion } from "framer-motion";

const CATEGORIES = [
  'Todos',
  'Tragamonedas',
  'Crash Games',
  'Ruleta',
  'Blackjack',
  'Slots',
  'Mesa',
  'Instantáneo'
];

// Mapping local de imágenes originales para que no se pierdan
const LOCAL_THUMBNAILS = {
  'blackjack': '/juegos/Blackjack.png',
  'tragamonedas': '/juegos/Tragamonedas.png',
  'nebula': '/juegos/NebulaGame.png',
  'penalty': '/juegos/Penalty.png',
  'lightning roulette': '/juegos/Ruleta.png',
  'plinko': '/juegos/Plinko_Game.png',
  'chickenroad': '/juegos/ChickenRoad.png'
};

const getGameImage = (game) => {
  if (game.imagen_url) return game.imagen_url;
  
  // Buscar coincidencia en el nombre para mantener las imágenes originales
  const nombreLower = game.nombre.toLowerCase();
  for (const [key, path] of Object.entries(LOCAL_THUMBNAILS)) {
    if (nombreLower.includes(key)) return path;
  }
  
  return '/juegos/Blackjack.png'; // Fallback final
};

export default function CasinoPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_Back_Url || 'http://localhost:3000';
        const res = await fetch(`${apiUrl}/juegos-casino`);
        if (res.ok) {
          const data = await res.json();
          setGames(data);
        }
      } catch (error) {
        console.error("Error fetching games:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, []);

  const filteredGames = games.filter((game) => {
    const matchesSearch =
      game.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (game.proveedor && game.proveedor.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Normalize categories for matching
    let categoryMatch = false;
    if (selectedCategory === "Todos") {
      categoryMatch = true;
    } else {
      categoryMatch = game.categoria?.toLowerCase() === selectedCategory.toLowerCase();
    }
    
    return matchesSearch && categoryMatch;
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section */}
      <div className="relative h-[200px] md:h-[300px] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-900 to-black z-10 opacity-90" />
        <Image
          src="/assets/juegos/blackjackff.png"
          alt="Casino Hero"
          fill
          className="object-cover opacity-50"
        />
        <div className="relative z-20 container h-full flex flex-col justify-center">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-2 tracking-tighter">
            CASINO <span className="text-green-500">ONLINE</span>
          </h1>
          <p className="text-white/80 text-lg max-w-xl">
            Disfruta de los mejores juegos de casino, slots y mesas en vivo con la mejor tecnología.
          </p>
        </div>
      </div>

      <div className="container mt-8">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar juego o proveedor..."
              className="pl-9 bg-card/50 border-muted"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
            {CATEGORIES.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap ${selectedCategory === category
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "hover:bg-green-600/10 hover:text-green-600"
                  }`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <p className="text-lg text-muted-foreground">Cargando juegos...</p>
          </div>
        )}

        {/* Games Grid */}
        {!loading && filteredGames.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {filteredGames.map((game) => (
              <Link href={`/casino/play/${game.id}`} key={game.id}>
                <motion.div
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-card border border-border/50 shadow-lg cursor-pointer"
                >
                  <Image
                    src={getGameImage(game)}
                    alt={game.nombre}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />

                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center z-20">
                    <Button className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-4 bg-primary hover:bg-primary/90 font-bold px-8">
                      Jugar
                    </Button>
                  </div>

                  {/* Game Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-bold text-lg leading-tight mb-1 truncate">
                      {game.nombre}
                    </h3>
                    <p className="text-white/60 text-xs font-medium uppercase tracking-wider">
                      {game.proveedor}
                    </p>
                  </div>

                  {/* Live Badge */}
                  {game.categoria === 'Casino en Vivo' && (
                    <div className="absolute top-3 left-3">
                      <Badge variant="destructive" className="flex items-center gap-1 px-2 h-5 text-[10px]">
                        <span className="animate-pulse h-1.5 w-1.5 bg-white rounded-full" />
                        LIVE
                      </Badge>
                    </div>
                  )}
                </motion.div>
              </Link>
            ))}
          </div>
        ) : !loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-muted/20 rounded-full p-6 mb-4">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No se encontraron juegos</h3>
            <p className="text-muted-foreground">
              Intenta con otra búsqueda o categoría.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}