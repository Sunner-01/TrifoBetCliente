// components/auth-modal.jsx
"use client";

import React from "react";
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
import { Eye, EyeOff, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthModalLogic } from "@/hooks/useAuthModalLogic";

// Refactorizado para cumplir con SRP y Clean Code:
// La lógica de negocio y llamadas a la API se han movido a `useAuthModalLogic`.
// Este componente ahora es puramente declarativo y se encarga exclusivamente de la UI.
export default function AuthModal({ isOpen, onClose, defaultTab = "login", onLogin }) {
  const {
    showPassword, setShowPassword,
    activeTab, handleTabChange,
    registerStep, setRegisterStep,
    credentials, setCredentials,
    isLoading, loginError,
    paises, paisSeleccionado, setPaisSeleccionado, loadingPaises,
    handleLogin, handleRegisterNext, handleRegister, handleClose,
    formRef
  } = useAuthModalLogic({ defaultTab, onLogin, onClose });

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-none">
            <TabsTrigger value="login" className="py-3 text-base">Iniciar Sesión</TabsTrigger>
            <TabsTrigger value="register" className="py-3 text-base">Registro</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-bold text-center">Acceder a TrifoBet</DialogTitle>
              <DialogDescription className="text-center">Ingresa tus credenciales para acceder a tu cuenta</DialogDescription>
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
                    onChange={(e) => setCredentials({ ...credentials, usuario: e.target.value })}
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
                      onChange={(e) => setCredentials({ ...credentials, contrasena: e.target.value })}
                      required
                    />
                    <Button
                      type="button" variant="ghost" size="icon"
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
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Iniciando Sesión...</> : "Iniciar Sesión"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="register" className="p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-bold text-center">Crear una cuenta</DialogTitle>
              <DialogDescription className="text-center">Regístrate para comenzar a jugar en TrifoBet</DialogDescription>
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
                    type="button" variant="ghost" size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <Input id="confirm-password" type={showPassword ? "text" : "password"} placeholder="Confirmar contraseña" required />
                <Button type="submit" className="w-full">Continuar</Button>
              </form>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto pr-2">
                <form ref={formRef} onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Input id="first-name" placeholder="Nombre" required />
                    <Input id="last-name" placeholder="Primer Apellido" required />
                    <Input id="second-last-name" placeholder="Segundo Apellido" />
                  </div>
                  <Input id="document-number" placeholder="Número de Documento" inputMode="numeric" required />
                  <Input id="dob" type="date" placeholder="Fecha de Nacimiento" required />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">+591</span>
                    <Input id="phone" type="tel" inputMode="numeric" placeholder="71234567" required className="pl-12" />
                  </div>



                  <div className="flex gap-4">
                    <Button type="button" variant="outline" className="w-full" onClick={() => setRegisterStep(1)}>Atrás</Button>
                    <Button type="submit" className="w-full">Registrarse</Button>
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