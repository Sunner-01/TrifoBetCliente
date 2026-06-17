
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Bell,
  Eye,
  EyeOff,
  Camera,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Lock,
  Smartphone,
  CreditCard,
  FileText,
  Upload,
  Target,
  LogOut,
  TrendingUp,
  TrendingDown,
  Calendar,
  Trophy,
  Activity,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { apiGet, apiPatch } from "@/lib/api";
import { API_Back_Url as API_URL } from "@/lib/config";
import { ProfileRetirosTab } from "./profile-retiros-tab";

export default function ProfileModal({ isOpen, onClose, userData = {}, onUserDataUpdate, onLogout }) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [hasChanges, setHasChanges] = useState(false); // Rastrear cambios
  const [showPhotoModal, setShowPhotoModal] = useState(false); // Modal para ver foto completa
  const [formData, setFormData] = useState({
    id: userData.id_usuario || 0,
    nombre: userData.nombres || "",
    apellido1: userData.apellido_1 || "",
    apellido2: userData.apellido_2 || "",
    fecha_nacimiento: userData.fecha_nacimiento || "",
    correo: userData.correo || "",
    telefono: userData.telefono || "",
    saldo: userData.saldo || 0.00,
    foto_perfil_url: userData.foto_perfil_url || "/placeholder-user.jpg",
    pais_codigo: userData.pais || "BO",
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Estados para KYC
  const [kycEstado, setKycEstado] = useState(null); // 'sin_enviar', 'pendiente', 'aprobado', 'rechazado'
  const [kycMensaje, setKycMensaje] = useState("");
  const [kycAnverso, setKycAnverso] = useState(null);
  const [kycReverso, setKycReverso] = useState(null);
  const [isKycLoading, setIsKycLoading] = useState(true);
  const [isKycUploading, setIsKycUploading] = useState(false);
  const [kycError, setKycError] = useState(null);

  const { toast } = useToast();

  // Función para cargar datos del usuario desde el backend real
  const fetchUserData = async () => {
    try {
      const data = await apiGet('/perfil/me');
      console.log("Datos obtenidos del backend:", data);

      setFormData({
        id: data.id || 0,
        nombre: data.nombre || "",
        apellido1: data.apellido1 || "",
        apellido2: data.apellido2 || "",
        fecha_nacimiento: data.fecha_nacimiento || "",
        correo: data.correo || "",
        telefono: data.telefono || "",
        saldo: data.saldo || 0.00,
        foto_perfil_url: data.foto_perfil_url || "/placeholder-user.jpg",
        pais_codigo: data.pais_codigo || "BO",
      });

      // Cargar estado de KYC
      try {
        const kycData = await apiGet('/verificacion/estado');
        setKycEstado(kycData.estado);
        if (kycData.notas_rechazo) setKycMensaje(kycData.notas_rechazo);
      } catch (error) {
        console.error("Error al cargar estado KYC:", error);
      } finally {
        setIsKycLoading(false);
      }
    } catch (error) {
      console.error("Error al cargar datos del usuario:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los datos del usuario",
        variant: "destructive",
      });
    }
  };

  // Cargar datos al abrir el modal
  useEffect(() => {
    if (isOpen) {
      fetchUserData();
    }
  }, [isOpen]);

  // Actualizar datos al cerrar el modal si hubo cambios
  const handleClose = () => {
    if (hasChanges) {
      onUserDataUpdate({
        ...userData,
        nombre: formData.nombre,
        apellido1: formData.apellido1,
        apellido2: formData.apellido2,
        correo: formData.correo,
        telefono: formData.telefono,
        foto_perfil_url: formData.foto_perfil_url,
        saldo: formData.saldo,
        name: `${formData.nombre || ""} ${formData.apellido1 || ""} ${formData.apellido2 || ""}`.trim() || "Usuario Anónimo",
      });
    }
    setIsEditing(false);
    setHasChanges(false);
    setNewPassword("");
    setConfirmPassword("");
    onClose();
  };

  const handleSaveProfile = async () => {
    // Validaciones
    if (!formData.nombre || !formData.apellido1) {
      toast({
        title: "Error",
        description: "El nombre y el primer apellido son obligatorios",
        variant: "destructive",
      });
      return;
    }
    if (!/^[a-zA-Z\s]{2,50}$/.test(formData.nombre)) {
      toast({
        title: "Error",
        description: "El nombre debe tener entre 2 y 50 caracteres, solo letras y espacios",
        variant: "destructive",
      });
      return;
    }
    if (!/^[a-zA-Z\s]{2,50}$/.test(formData.apellido1)) {
      toast({
        title: "Error",
        description: "El primer apellido debe tener entre 2 y 50 caracteres, solo letras y espacios",
        variant: "destructive",
      });
      return;
    }
    if (formData.apellido2 && !/^[a-zA-Z\s]{2,50}$/.test(formData.apellido2)) {
      toast({
        title: "Error",
        description: "El segundo apellido debe tener entre 2 y 50 caracteres, solo letras y espacios",
        variant: "destructive",
      });
      return;
    }
    if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.correo)) {
      toast({
        title: "Error",
        description: "Por favor, ingresa un correo electrónico válido",
        variant: "destructive",
      });
      return;
    }
    if (formData.telefono && !/^\+?\d{7,15}$/.test(formData.telefono)) {
      toast({
        title: "Error",
        description: "El teléfono debe tener entre 7 y 15 dígitos, puede incluir '+'",
        variant: "destructive",
      });
      return;
    }
    if (formData.numero_documento && !/^[a-zA-Z0-9-]{5,20}$/.test(formData.numero_documento)) {
      toast({
        title: "Error",
        description: "El número de documento debe tener entre 5 y 20 caracteres alfanuméricos",
        variant: "destructive",
      });
      return;
    }
    if (formData.codigo_postal && !/^\d{4,10}$/.test(formData.codigo_postal)) {
      toast({
        title: "Error",
        description: "El código postal debe tener entre 4 y 10 dígitos",
        variant: "destructive",
      });
      return;
    }
    if (!formData.fecha_nacimiento) {
      toast({
        title: "Error",
        description: "La fecha de nacimiento es obligatoria",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Enviando datos para actualizar:", formData);

      // Usar API del backend real
      const updatedData = await apiPatch('/perfil/me', {
        nombre: formData.nombre,
        apellido1: formData.apellido1,
        apellido2: formData.apellido2,
        telefono: formData.telefono,
      });

      console.log("Datos actualizados recibidos:", updatedData);

      setHasChanges(true);
      await fetchUserData(); // Recargar datos desde la API
      toast({
        title: "Perfil actualizado",
        description: "Tus datos han sido guardados correctamente",
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error al guardar perfil:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el perfil",
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = async () => {
    // Validaciones
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Debes ingresar la nueva contraseña y confirmarla",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(newPassword)) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 8 caracteres, incluyendo letras y números",
        variant: "destructive",
      });
      return;
    }

    try {
      // TODO: Implementar bcryptjs para hashear la contraseña
      const response = await fetch("/api/usuarios", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_usuario: formData.id_usuario,
          contrasena: newPassword,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al cambiar la contraseña");
      }
      const updatedData = await response.json();
      console.log("Contraseña actualizada:", updatedData);

      setHasChanges(true);
      await fetchUserData(); // Recargar datos desde la API
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada correctamente",
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo cambiar la contraseña",
        variant: "destructive",
      });
    }
  };

  const handleSaveChanges = async () => {
    try {
      if (activeTab === "profile") {
        await handleSaveProfile();
      } else if (activeTab === "security") {
        await handleChangePassword();
      } else {
        toast({
          title: "Advertencia",
          description: "No hay cambios para guardar en esta pestaña",
          variant: "default",
        });
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error al guardar cambios:", error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setNewPassword("");
    setConfirmPassword("");
    // Recargar datos desde el backend
    fetchUserData();
  };

  const handleUploadPhoto = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formDataToSend = new FormData();
      formDataToSend.append("foto", file);
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/perfil/me/photo`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
          body: formDataToSend,
        });
        
        if (response.ok) {
          const result = await response.json();
          setFormData((prev) => ({ ...prev, foto_perfil: result.foto_perfil_url }));
          setHasChanges(true);
          await fetchUserData(); // Recargar datos desde la API
          toast({ title: "Foto actualizada", description: "La foto se ha guardado exitosamente" });
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || "Fallo al subir la foto");
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error.message || "Ocurrió un error al subir la foto",
          variant: "destructive",
        });
      }
    }
  };

  const handleLogout = () => {
    onLogout();
    handleClose();
    toast({ title: "Sesión cerrada", description: "Has cerrado sesión correctamente" });
  };

  const handleKycFileChange = (e, setFile) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setKycError("Una de las imágenes supera el límite de 2 MB. Por favor, elige una más ligera.");
        toast({ title: "Archivo muy grande", description: "La imagen no debe superar los 2MB", variant: "destructive" });
        return;
      }
      setKycError(null); // Limpiar error si la imagen es válida
      setFile(file);
    }
  };

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    setKycError(null);

    if (!kycAnverso || !kycReverso) {
      setKycError("Debes seleccionar las 2 imágenes antes de enviar.");
      return;
    }

    setIsKycUploading(true);

    try {
      // La clave correcta en localStorage es 'token', no 'auth'
      const token = localStorage.getItem("token");
      if (!token) {
        setKycError("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
        return;
      }

      const formDataKyc = new FormData();
      formDataKyc.append("anverso", kycAnverso);
      formDataKyc.append("reverso", kycReverso);

      const response = await fetch(`${API_URL}/verificacion/subir`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formDataKyc,
      });

      const result = await response.json();

      if (response.ok) {
        toast({ title: "¡Documentos enviados!", description: "Tus documentos están siendo revisados por nuestro equipo." });
        setKycEstado("pendiente");
        setKycAnverso(null);
        setKycReverso(null);
      } else {
        const msg = Array.isArray(result.message) ? result.message.join(", ") : (result.message || "Error al subir los documentos.");
        setKycError(msg);
      }
    } catch (error) {
      setKycError("No se pudo conectar con el servidor. Verifica tu conexión.");
    } finally {
      setIsKycUploading(false);
    }
  };

  const getVerificationIcon = (status) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "not_verified":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getVerificationBadge = (status) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Verificado</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">Pendiente</Badge>;
      case "not_verified":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">No Verificado</Badge>;
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  const getBetStatusBadge = (status) => {
    switch (status) {
      case "won":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Ganada</Badge>;
      case "lost":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">Perdida</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">Pendiente</Badge>;
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "login":
        return <User className="h-4 w-4 text-blue-600" />;
      case "bet":
        return <Target className="h-4 w-4 text-green-600" />;
      case "deposit":
        return <TrendingUp className="h-4 w-4 text-purple-600" />;
      case "withdrawal":
        return <TrendingDown className="h-4 w-4 text-orange-600" />;
      case "profile":
        return <Settings className="h-4 w-4 text-gray-600" />;
      case "security":
        return <Shield className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const verificationStatus = {
    email: formData.correo_verificado ? "verified" : "not_verified",
    phone: "pending",
    identity: "verified",
    address: "not_verified",
  };

  const accountStats = {
    memberSince: formData.fecha_creacion ? new Date(formData.fecha_creacion).toLocaleDateString() : "N/A",
    totalDeposits: 2500,
    totalWithdrawals: 1200,
    totalBets: 156,
    winRate: 68,
    favoriteGame: "Blackjack",
    vipLevel: formData.id_rol === 1 ? "VIP" : "",
  };

  const bettingHistory = [
    {
      id: 1,
      date: "2024-01-15 19:30",
      event: "Barcelona vs Real Madrid",
      sport: "Fútbol",
      bet: "Barcelona Gana",
      odds: 2.15,
      amount: 50,
      status: "won",
      payout: 107.5,
    },
    {
      id: 2,
      date: "2024-01-14 21:00",
      event: "Lakers vs Warriors",
      sport: "Baloncesto",
      bet: "Más de 220.5 puntos",
      odds: 1.85,
      amount: 25,
      status: "lost",
      payout: 0,
    },
    {
      id: 3,
      date: "2024-01-13 16:15",
      event: "Manchester United vs Chelsea",
      sport: "Fútbol",
      bet: "Empate",
      odds: 3.2,
      amount: 30,
      status: "won",
      payout: 96.0,
    },
    {
      id: 4,
      date: "2024-01-12 20:45",
      event: "Celtics vs Heat",
      sport: "Baloncesto",
      bet: "Celtics -5.5",
      odds: 1.9,
      amount: 40,
      status: "pending",
      payout: 0,
    },
    {
      id: 5,
      date: "2024-01-11 18:30",
      event: "Atletico Madrid vs Sevilla",
      sport: "Fútbol",
      bet: "Menos de 2.5 goles",
      odds: 2.05,
      amount: 35,
      status: "lost",
      payout: 0,
    },
    {
      id: 6,
      date: "2024-01-10 22:00",
      event: "Nuggets vs Suns",
      sport: "Baloncesto",
      bet: "Nuggets Gana",
      odds: 1.75,
      amount: 60,
      status: "won",
      payout: 105.0,
    },
  ];

  const recentActivity = [
    {
      type: "login",
      description: "Inicio de sesión Sucre, Bolivia",
      time: "Hace 2 horas",
      ip: "192.168.1.1",
      device: "Chrome - Windows",
    },
    {
      type: "bet",
      description: "Apuesta en Barcelona vs Real Madrid",
      time: "Hace 5 horas",
      amount: "Bs 50",
      status: "won",
    },
    {
      type: "deposit",
      description: "Depósito con tarjeta de crédito",
      time: "Ayer",
      amount: "Bs 200",
      method: "Visa ****1234",
    },
    {
      type: "withdrawal",
      description: "Retiro a PayPal",
      time: "Hace 3 días",
      amount: "Bs 150",
      status: "completed",
    },
    {
      type: "login",
      description: "Inicio de sesión desde móvil",
      time: "Hace 1 semana",
      ip: "192.168.1.2",
      device: "Safari - iPhone",
    },
    {
      type: "bet",
      description: "Apuesta en Lakers vs Warriors",
      time: "Hace 1 semana",
      amount: "Bs 25",
      status: "lost",
    },
    {
      type: "deposit",
      description: "Depósito con Skrill",
      time: "Hace 2 semanas",
      amount: "Bs 100",
      method: "Skrill",
    },
    {
      type: "withdrawal",
      description: "Retiro a cuenta bancaria",
      time: "Hace 2 semanas",
      amount: "Bs 300",
      status: "completed",
    },
    {
      type: "profile",
      description: "Actualización de información personal",
      time: "Hace 3 semanas",
      details: "Cambio de teléfono",
    },
    {
      type: "security",
      description: "Cambio de contraseña",
      time: "Hace 1 mes",
      details: "Contraseña actualizada exitosamente",
    },
  ];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <User className="h-6 w-6 text-primary" />
              Mi Perfil
            </DialogTitle>
            <DialogDescription>Gestiona tu información personal, configuración y seguridad</DialogDescription>
          </DialogHeader>

          {/* Profile Header */}
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div
                    className="cursor-pointer transition-transform hover:scale-105"
                    onClick={() => setShowPhotoModal(true)}
                    title="Click para ver en tamaño completo"
                  >
                    <Image
                      src={formData.foto_perfil_url || "/placeholder-user.jpg"}
                      alt={formData.nombre || "Usuario"}
                      width={80}
                      height={80}
                      className="rounded-full border-4 border-white shadow-lg object-cover"
                    />
                    <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <Button
                    size="icon"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                    variant="secondary"
                    onClick={() => {
                      const fileInput = document.createElement("input");
                      fileInput.type = "file";
                      fileInput.accept = "image/*";
                      fileInput.onchange = (e) => {
                        const file = e.target.files[0];
                        if (file && file.size > 2 * 1024 * 1024) {
                          toast({ title: "Archivo muy grande", description: "La foto de perfil no debe superar los 2MB", variant: "destructive" });
                          return;
                        }
                        handleUploadPhoto(e);
                      };
                      fileInput.click();
                    }}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold">{`${formData.nombre || ""} ${formData.apellido1 || ""} ${formData.apellido2 || ""}`.trim() || "Usuario Anónimo"}</h3>
                  <p className="text-muted-foreground">{formData.correo || "Sin correo"}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge variant="outline" className="text-green-600 border-green-600">Saldo: Bs {(formData.saldo || 0).toFixed(2)}</Badge>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
                    <Settings className="h-4 w-4 mr-2" />
                    {isEditing ? "Cancelar" : "Editar"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 flex items-center gap-1 text-xs"
                  >
                    <LogOut className="h-3 w-3" />
                    Cerrar Sesión
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex-1 overflow-auto min-h-0">
            <Tabs defaultValue="profile" className="flex flex-col h-full" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-6 shrink-0">
                <TabsTrigger value="profile">Perfil</TabsTrigger>
                <TabsTrigger value="retiros">Retiros</TabsTrigger>
                <TabsTrigger value="bets">Apuestas</TabsTrigger>
                <TabsTrigger value="security">Seguridad</TabsTrigger>
                <TabsTrigger value="verification">Verificación</TabsTrigger>
                <TabsTrigger value="activity">Actividad</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="flex-1 overflow-hidden h-full">
                <ScrollArea className="h-[calc(100vh-350px)]">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-1 pb-6">
                    {/* Personal Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Información Personal
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="nombres">Nombre</Label>
                            <Input
                              id="nombres"
                              value={formData.nombre || ""}
                              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                              disabled={!isEditing}
                            />
                          </div>
                          <div>
                            <Label htmlFor="apellido_1">Apellido 1</Label>
                            <Input
                              id="apellido_1"
                              value={formData.apellido1 || ""}
                              onChange={(e) => setFormData({ ...formData, apellido1: e.target.value })}
                              disabled={!isEditing}
                            />
                          </div>
                          <div>
                            <Label htmlFor="apellido_2">Apellido 2</Label>
                            <Input
                              id="apellido_2"
                              value={formData.apellido2 || ""}
                              onChange={(e) => setFormData({ ...formData, apellido2: e.target.value })}
                              disabled={!isEditing}
                            />
                          </div>
                          <div>
                            <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
                            <Input
                              id="fecha_nacimiento"
                              type="date"
                              value={formData.fecha_nacimiento || ""}
                              onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                              disabled={!isEditing}
                            />
                          </div>
                          <div>
                            <Label htmlFor="correo">Email</Label>
                            <Input
                              id="correo"
                              type="email"
                              value={formData.correo || ""}
                              onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                              disabled={!isEditing}
                            />
                          </div>
                          <div>
                            <Label htmlFor="telefono">Teléfono</Label>
                            <Input
                              id="telefono"
                              value={formData.telefono || ""}
                              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                              disabled={!isEditing}
                            />
                          </div>

                          <div>
                            <Label htmlFor="pais">País</Label>
                            <Select
                              value={formData.pais}
                              onValueChange={(value) => setFormData({ ...formData, pais: value })}
                              disabled={!isEditing}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Bolivia">Bolivia</SelectItem>
                                <SelectItem value="México">México</SelectItem>
                                <SelectItem value="Argentina">Argentina</SelectItem>
                                <SelectItem value="Colombia">Colombia</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="tipo_documento">Tipo de Documento</Label>
                            <Select
                              value={formData.tipo_documento}
                              onValueChange={(value) => setFormData({ ...formData, tipo_documento: value })}
                              disabled={!isEditing}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="DNI">DNI</SelectItem>
                                <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                                <SelectItem value="NIE">NIE</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="numero_documento">Número de Documento (CI)</Label>
                            <Input
                              id="numero_documento"
                              value={formData.numero_documento}
                              onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value })}
                              disabled={!isEditing}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Account Statistics */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Estadísticas de Cuenta</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Miembro desde</p>
                            <p className="font-bold">{accountStats.memberSince}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Total Depositado</p>
                            <p className="font-bold text-green-600">Bs {accountStats.totalDeposits}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Total Retirado</p>
                            <p className="font-bold text-blue-600">Bs {accountStats.totalWithdrawals}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Apuestas Realizadas</p>
                            <p className="font-bold">{accountStats.totalBets}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Tasa de Acierto</p>
                            <p className="font-bold text-green-600">{accountStats.winRate}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Juego Favorito</p>
                            <p className="font-medium">{accountStats.favoriteGame}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="retiros" className="flex-1 overflow-hidden h-full">
                <ScrollArea className="h-[calc(100vh-350px)]">
                  <div className="p-1 pb-6">
                    <ProfileRetirosTab userId={formData.id} />
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="bets" className="flex-1 overflow-hidden h-full">
                <ScrollArea className="h-[calc(100vh-350px)]">
                  <div className="p-1 pb-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-600" />
                        Historial de Apuestas
                      </h3>
                      <div className="flex gap-2">
                        <Select defaultValue="all">
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            <SelectItem value="won">Ganadas</SelectItem>
                            <SelectItem value="lost">Perdidas</SelectItem>
                            <SelectItem value="pending">Pendientes</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select defaultValue="all-sports">
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all-sports">Todos</SelectItem>
                            <SelectItem value="futbol">Fútbol</SelectItem>
                            <SelectItem value="baloncesto">Baloncesto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {bettingHistory.map((bet) => (
                        <Card key={bet.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">{bet.date}</span>
                                  </div>
                                  <Badge variant="outline">{bet.sport}</Badge>
                                  {getBetStatusBadge(bet.status)}
                                </div>
                                <h4 className="font-semibold text-lg mb-1">{bet.event}</h4>
                                <p className="text-muted-foreground mb-2">{bet.bet}</p>
                                <div className="flex items-center gap-4 text-sm">
                                  <span>
                                    Cuota: <strong>{bet.odds}</strong>
                                  </span>
                                  <span>
                                    Apostado: <strong>Bs {bet.amount}</strong>
                                  </span>
                                  {bet.status === "won" && (
                                    <span className="text-green-600">
                                      Ganancia: <strong>Bs {bet.payout}</strong>
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                {bet.status === "won" && (
                                  <div className="text-2xl font-bold text-green-600">+Bs {bet.payout}</div>
                                )}
                                {bet.status === "lost" && (
                                  <div className="text-2xl font-bold text-red-600">-Bs {bet.amount}</div>
                                )}
                                {bet.status === "pending" && (
                                  <div className="text-2xl font-bold text-yellow-600">Bs {bet.amount}</div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Betting Summary */}
                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle>Resumen de Apuestas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-green-600">4</p>
                            <p className="text-sm text-muted-foreground">Ganadas</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-red-600">2</p>
                            <p className="text-sm text-muted-foreground">Perdidas</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-yellow-600">1</p>
                            <p className="text-sm text-muted-foreground">Pendientes</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-blue-600">68%</p>
                            <p className="text-sm text-muted-foreground">Tasa de Acierto</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="security" className="flex-1 overflow-hidden h-full">
                <ScrollArea className="h-[calc(100vh-350px)]">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-1 pb-6">
                    {/* Password */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lock className="h-5 w-5" />
                          Contraseña
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="currentPassword">Contraseña Actual</Label>
                          <div className="relative">
                            <Input
                              id="currentPassword"
                              type={showPassword ? "text" : "password"}
                              value={formData.contrasena}
                              onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })}
                              disabled={!isEditing}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="newPassword">Nueva Contraseña</Label>
                          <Input
                            id="newPassword"
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={!isEditing}
                          />
                        </div>
                        <div>
                          <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                          <Input
                            id="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={!isEditing}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Two-Factor Authentication */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Smartphone className="h-5 w-5" />
                          Autenticación de Dos Factores
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">SMS</p>
                            <p className="text-sm text-muted-foreground">Recibir códigos por SMS</p>
                          </div>
                          <Switch checked={false} onCheckedChange={() => { }} disabled={!isEditing} />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">App Autenticadora</p>
                            <p className="text-sm text-muted-foreground">Google Authenticator, Authy</p>
                          </div>
                          <Switch checked={false} onCheckedChange={() => { }} disabled={!isEditing} />
                        </div>
                        <Button variant="outline" className="w-full" disabled={!isEditing}>
                          Configurar 2FA
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="verification" className="flex-1 overflow-hidden h-full">
                <ScrollArea className="h-[calc(100vh-350px)]">
                  <div className="grid grid-cols-1 gap-6 p-1 pb-6">
                    {/* Identity Verification (KYC) */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-primary" />
                          Verificación de Identidad (KYC)
                        </CardTitle>
                        <DialogDescription>
                          Requisito obligatorio para poder realizar retiros de tus ganancias.
                        </DialogDescription>
                      </CardHeader>
                      <CardContent>
                        {isKycLoading ? (
                          <div className="flex justify-center p-8">
                            <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {kycEstado === "aprobado" && (
                              <div className="bg-green-500/10 border border-green-500/30 p-6 rounded-xl text-center">
                                <CheckCircle size={48} className="mx-auto text-green-500 mb-3" />
                                <h2 className="text-xl font-bold text-green-500 mb-2">¡Identidad Verificada!</h2>
                                <p className="text-sm text-foreground">
                                  Tu identidad ha sido verificada correctamente. Ya puedes solicitar retiros de tus ganancias.
                                </p>
                              </div>
                            )}

                            {kycEstado === "pendiente" && (
                              <div className="bg-yellow-500/10 border border-yellow-500/30 p-6 rounded-xl text-center">
                                <Clock size={48} className="mx-auto text-yellow-500 mb-3 animate-pulse" />
                                <h2 className="text-xl font-bold text-yellow-500 mb-2">En Revisión</h2>
                                <p className="text-sm text-foreground">
                                  Nuestro equipo está revisando tus documentos. Te notificaremos cuando el proceso esté completo.
                                </p>
                              </div>
                            )}

                            {(kycEstado === "sin_enviar" || kycEstado === "rechazado" || kycEstado === null) && (
                              <div className="space-y-6 animate-in fade-in">
                                {kycEstado === "rechazado" && (
                                  <div className="bg-destructive/10 border border-destructive/30 p-4 rounded-xl flex items-start gap-3">
                                    <AlertTriangle className="text-destructive shrink-0 mt-0.5" size={20} />
                                    <div>
                                      <h3 className="font-bold text-destructive text-sm">Solicitud Rechazada</h3>
                                      <p className="text-destructive font-medium text-sm mt-1">{kycMensaje}</p>
                                      <p className="text-xs text-muted-foreground mt-1">Por favor, sube los documentos nuevamente.</p>
                                    </div>
                                  </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <label className="block text-sm font-medium">1. Anverso de tu CI</label>
                                    <div className="relative border-2 border-dashed border-border rounded-lg p-6 hover:bg-muted/50 transition-colors text-center cursor-pointer group">
                                      <input 
                                        type="file" 
                                        accept="image/jpeg, image/png, image/webp"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        onChange={(e) => handleKycFileChange(e, setKycAnverso)}
                                      />
                                      {kycAnverso ? (
                                        <div className="text-primary text-sm font-medium flex flex-col items-center gap-1">
                                          <CheckCircle size={20} />
                                          <span className="truncate w-full px-2">{kycAnverso.name}</span>
                                        </div>
                                      ) : (
                                        <div className="text-muted-foreground group-hover:text-primary transition-colors flex flex-col items-center">
                                          <Upload size={24} className="mb-2" />
                                          <span className="text-sm font-medium">Subir Anverso</span>
                                          <span className="text-xs text-muted-foreground mt-1 text-center">Formatos: JPG, PNG, WEBP<br/>Peso Máximo: 2 MB</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="block text-sm font-medium">2. Reverso de tu CI</label>
                                    <div className="relative border-2 border-dashed border-border rounded-lg p-6 hover:bg-muted/50 transition-colors text-center cursor-pointer group">
                                      <input 
                                        type="file" 
                                        accept="image/jpeg, image/png, image/webp"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        onChange={(e) => handleKycFileChange(e, setKycReverso)}
                                      />
                                      {kycReverso ? (
                                        <div className="text-primary text-sm font-medium flex flex-col items-center gap-1">
                                          <CheckCircle size={20} />
                                          <span className="truncate w-full px-2">{kycReverso.name}</span>
                                        </div>
                                      ) : (
                                        <div className="text-muted-foreground group-hover:text-primary transition-colors flex flex-col items-center">
                                          <Upload size={24} className="mb-2" />
                                          <span className="text-sm font-medium">Subir Reverso</span>
                                          <span className="text-xs text-muted-foreground mt-1 text-center">Formatos: JPG, PNG, WEBP<br/>Peso Máximo: 2 MB</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {kycError && (
                                  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive flex items-start gap-2">
                                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                    <span>{kycError}</span>
                                  </div>
                                )}

                                <Button 
                                  onClick={handleKycSubmit} 
                                  className="w-full h-11 text-base font-semibold"
                                  disabled={isKycUploading}
                                >
                                  {isKycUploading ? (
                                    <span className="flex items-center gap-2">
                                      <Clock size={16} className="animate-spin" />
                                      Subiendo documentos...
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-2">
                                      <Upload size={16} />
                                      Enviar para Verificación
                                    </span>
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Email Verification Component */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Verificaciones Secundarias</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/20">
                          <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <span className="text-sm font-medium block">Correo Electrónico</span>
                              <span className="text-xs text-muted-foreground">{formData.correo}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getVerificationIcon(verificationStatus.email)}
                            {getVerificationBadge(verificationStatus.email)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/20">
                          <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <span className="text-sm font-medium block">Teléfono Móvil</span>
                              <span className="text-xs text-muted-foreground">{formData.telefono || "No registrado"}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getVerificationIcon(verificationStatus.phone)}
                            {getVerificationBadge(verificationStatus.phone)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="activity" className="flex-1 overflow-hidden h-full">
                <ScrollArea className="h-[calc(100vh-350px)]">
                  <div className="p-1 pb-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="h-5 w-5" />
                          Actividad Reciente
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {recentActivity.map((activity, index) => (
                            <div key={index} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                              <div
                                className={`p-2 rounded-lg ${activity.type === "login"
                                  ? "bg-blue-100 dark:bg-blue-900/20"
                                  : activity.type === "bet"
                                    ? "bg-green-100 dark:bg-green-900/20"
                                    : activity.type === "deposit"
                                      ? "bg-purple-100 dark:bg-purple-900/20"
                                      : activity.type === "withdrawal"
                                        ? "bg-orange-100 dark:bg-orange-900/20"
                                        : activity.type === "profile"
                                          ? "bg-gray-100 dark:bg-gray-900/20"
                                          : "bg-red-100 dark:bg-red-900/20"
                                  }`}
                              >
                                {getActivityIcon(activity.type)}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{activity.description}</p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span>{activity.time}</span>
                                  {activity.ip && <span>IP: {activity.ip}</span>}
                                  {activity.device && <span>{activity.device}</span>}
                                  {activity.method && <span>{activity.method}</span>}
                                  {activity.details && <span>{activity.details}</span>}
                                </div>
                              </div>
                              <div className="text-right">
                                {activity.amount && (
                                  <div
                                    className={`font-medium ${activity.type === "bet" && activity.status === "won"
                                      ? "text-green-600"
                                      : activity.type === "bet" && activity.status === "lost"
                                        ? "text-red-600"
                                        : activity.type === "deposit"
                                          ? "text-green-600"
                                          : activity.type === "withdrawal"
                                            ? "text-orange-600"
                                            : "text-primary"
                                      }`}
                                  >
                                    {activity.amount}
                                  </div>
                                )}
                                {activity.status && (
                                  <Badge
                                    className={`text-xs ${activity.status === "won"
                                      ? "bg-green-100 text-green-800"
                                      : activity.status === "lost"
                                        ? "bg-red-100 text-red-800"
                                        : activity.status === "completed"
                                          ? "bg-blue-100 text-blue-800"
                                          : "bg-gray-100 text-gray-800"
                                      }`}
                                  >
                                    {activity.status === "won"
                                      ? "Ganada"
                                      : activity.status === "lost"
                                        ? "Perdida"
                                        : activity.status === "completed"
                                          ? "Completado"
                                          : activity.status}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer de edicion - solo visible al editar */}
          {isEditing && (
            <div className="flex justify-end gap-2 pt-3 border-t shrink-0">
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancelar
              </Button>
              <Button onClick={handleSaveChanges}>Guardar Cambios</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showPhotoModal} onOpenChange={setShowPhotoModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Foto de Perfil</DialogTitle>
            <DialogDescription>
              {`${formData.nombre || ""} ${formData.apellido1 || ""}`.trim() || "Usuario"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center items-center p-4">
            <Image
              src={formData.foto_perfil_url || "/placeholder-user.jpg"}
              alt="Foto de perfil"
              width={500}
              height={500}
              className="rounded-lg object-cover max-h-[70vh] w-auto"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
