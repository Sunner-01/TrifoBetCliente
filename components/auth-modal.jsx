// components/auth-modal.jsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Facebook, Loader2 } from "lucide-react";
import { Icon } from "@iconify/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { API_Back_Url as API_URL } from "@/lib/config";
import { saveAuth } from "@/lib/auth";

export default function AuthModal({ isOpen, onClose, defaultTab = "login", onLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [registerStep, setRegisterStep] = useState(1);
  const [credentials, setCredentials] = useState({ usuario: "", contrasena: "" });
  const [registerData, setRegisterData] = useState({ usuario: "", email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const { toast } = useToast();
  const formRef = useRef(null);

  // Para el selector de países
  const [paises, setPaises] = useState([]);
  const [paisSeleccionado, setPaisSeleccionado] = useState("BO");
  const [loadingPaises, setLoadingPaises] = useState(false);

  // Cargar países al abrir el registro
  useEffect(() => {
    if (activeTab === "register" && paises.length === 0) {
      setLoadingPaises(true);
      fetch(`${API_URL}/pais`)
        .then((r) => r.json())
        .then((data) => {
          setPaises(data);
          const bolivia = data.find((p) => p.codigo === "BO");
          if (bolivia) setPaisSeleccionado(bolivia.codigo);
        })
        .catch(() => {
          toast({ title: "Error", description: "No se pudieron cargar los países", variant: "destructive" });
        })
        .finally(() => setLoadingPaises(false));
    }
  }, [activeTab, paises.length, toast]);

  // LOGIN (ya lo tenías bien, solo lo conecté al backend real)
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError(null);
    try {
      const body = {
        contrasena: credentials.contrasena,
      };
      const identificadorLimpio = credentials.usuario.trim();
      if (identificadorLimpio.includes("@")) {
        body.correo = identificadorLimpio;
      } else {
        body.nombreUsuario = identificadorLimpio;
      }

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok && data.access_token) {
        saveAuth(data.access_token, data.usuario);
        if (onLogin) onLogin(data.usuario);
        onClose();
        toast({ title: "¡Bienvenido!", description: "Sesión iniciada correctamente" });
      } else {
        const errorMsg = Array.isArray(data.message) ? data.message.join(", ") : (data.message || "Credenciales incorrectas");
        setLoginError(errorMsg);
      }
    } catch (error) {
      setLoginError("No se pudo conectar al servidor");
    } finally {
      setIsLoading(false);
    }
  };

  // PASO 1 → PASO 2
  const handleRegisterNext = (e) => {
    e.preventDefault();
    const usuario = e.target["usuario-register"].value.trim();
    const email = e.target["email-register"].value.trim();
    const password = e.target["password-register"].value;
    const confirmPassword = e.target["confirm-password"].value;

    if (!usuario || !email || !password || !confirmPassword) {
      toast({ title: "Error", description: "Todos los campos son obligatorios", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Error", description: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" });
      return;
    }

    setRegisterData({ usuario, email, password });
    setRegisterStep(2);
  };

  // REGISTRO FINAL → ENVÍA EXACTAMENTE LO QUE ESPERA TU BACKEND
  const handleRegister = async (e) => {
    e.preventDefault();
    const form = e.target;

    const payload = {
      nombre: form["first-name"].value.trim(),
      apellido1: form["last-name"].value.trim(),
      apellido2: form["second-last-name"].value.trim() || "",
      ci: form["document-number"].value.trim(),
      fechaNacimiento: form["dob"].value,
      nombreUsuario: registerData.usuario,
      correo: registerData.email,
      telefono: form["phone"].value.trim(),
      contrasena: registerData.password,
      paisCodigo: paisSeleccionado,
    };

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("👉 RESPUESTA DEL BACKEND:", data);

      if (response.status === 201 || response.ok) {
        toast({ title: "¡Cuenta creada!", description: "Iniciando sesión..." });

        // Login automático
        const loginRes = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombreUsuario: registerData.usuario,
            contrasena: registerData.password,
          }),
        });

        const loginData = await loginRes.json();
        if (loginRes.ok) {
          saveAuth(loginData.access_token, loginData.usuario);
          if (onLogin) onLogin(loginData.usuario);
          onClose();
        }
      } else {
        toast({ title: "Error", description: data.message || "Usuario o correo ya existen", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Error de conexión al servidor", variant: "destructive" });
    }
  };

  const resetState = () => {
    setRegisterStep(1);
    setShowPassword(false);
    setCredentials({ usuario: "", contrasena: "" });
    setRegisterData({ usuario: "", email: "", password: "" });
    formRef.current?.reset();
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
    resetState();
  };

  const handleClose = () => {
    onClose();
    setTimeout(resetState, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-none">
            <TabsTrigger value="login" className="py-3 text-base">
              Iniciar Sesión
            </TabsTrigger>
            <TabsTrigger value="register" className="py-3 text-base">
              Registro
            </TabsTrigger>
          </TabsList>

          {/* LOGIN (tu diseño original) */}
          <TabsContent value="login" className="p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-bold text-center">
                Acceder a TrifoBet
              </DialogTitle>
              <DialogDescription className="text-center">
                Ingresa tus credenciales para acceder a tu cuenta
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleLogin}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="usuario-login">Usuario o Email</Label>
                  <Input
                    id="usuario-login"
                    type="text"
                    placeholder="usuario o correo@ejemplo.com"
                    value={credentials.usuario}
                    onChange={(e) =>
                      setCredentials({ ...credentials, usuario: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password-login">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password-login"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={credentials.contrasena}
                      onChange={(e) =>
                        setCredentials({ ...credentials, contrasena: e.target.value })
                      }
                      required
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

                {loginError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive text-center">
                    {loginError}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Iniciando Sesión...
                    </>
                  ) : (
                    "Iniciar Sesión"
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* REGISTRO (tu diseño original + conexión real) */}
          <TabsContent value="register" className="p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-bold text-center">
                Crear una cuenta
              </DialogTitle>
              <DialogDescription className="text-center">
                Regístrate para comenzar a jugar en TrifoBet
              </DialogDescription>
            </DialogHeader>

            {registerStep === 1 ? (
              <form onSubmit={handleRegisterNext} className="space-y-4">
                <Input id="usuario-register" placeholder="Nombre de usuario" required />
                <Input id="email-register" type="email" placeholder="Email" required />
                <div className="relative">
                  <Input
                    id="password-register"
                    type={showPassword ? "text" : "password"}
                    placeholder="Contraseña"
                    required
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
                <Input id="confirm-password" type={showPassword ? "text" : "password"} placeholder="Confirmar contraseña" required />
                <Button type="submit" className="w-full">
                  Continuar
                </Button>
              </form>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto pr-2">
                <form ref={formRef} onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Input id="first-name" placeholder="Nombre" required />
                    <Input id="last-name" placeholder="Primer Apellido" required />
                    <Input id="second-last-name" placeholder="Segundo Apellido" />
                  </div>

                  <Input id="document-number" placeholder="Número de Documento" required />
                  <Input id="dob" type="date" placeholder="Fecha de Nacimiento" required />
                  <Input id="phone" placeholder="+591 71234567" required />

                  {/* SELECTOR DE PAÍSES FUNCIONAL */}
                  <div className="space-y-2">
                    <Label>País</Label>
                    {loadingPaises ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Cargando países...</span>
                      </div>
                    ) : (
                      <Select value={paisSeleccionado} onValueChange={setPaisSeleccionado}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tu país" />
                        </SelectTrigger>
                        <SelectContent>
                          {paises.map((pais) => (
                            <SelectItem key={pais.codigo} value={pais.codigo}>
                              {pais.nombre_es} ({pais.codigo_telefonico})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setRegisterStep(1)}
                    >
                      Atrás
                    </Button>
                    <Button type="submit" className="w-full">
                      Registrarse
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}