// hooks/useAuthModalLogic.js
// Extraemos toda la lógica de autenticación y estado del modal (SRP)
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { API_Back_Url as API_URL } from "@/lib/config";
import { saveAuth } from "@/lib/auth";

export function useAuthModalLogic({ defaultTab, onLogin, onClose }) {
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [registerStep, setRegisterStep] = useState(1);
  const [credentials, setCredentials] = useState({ usuario: "", contrasena: "" });
  const [registerData, setRegisterData] = useState({ usuario: "", email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);
  
  const [paises, setPaises] = useState([]);
  const [paisSeleccionado, setPaisSeleccionado] = useState("BO");
  const [loadingPaises, setLoadingPaises] = useState(false);
  
  const formRef = useRef(null);
  const { toast } = useToast();

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

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError(null);
    try {
      const body = { contrasena: credentials.contrasena };
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

      if (response.status === 201 || response.ok) {
        toast({ title: "¡Cuenta creada!", description: "Iniciando sesión..." });

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

  return {
    showPassword, setShowPassword,
    activeTab, handleTabChange,
    registerStep, setRegisterStep,
    credentials, setCredentials,
    isLoading, loginError,
    paises, paisSeleccionado, setPaisSeleccionado, loadingPaises,
    handleLogin, handleRegisterNext, handleRegister, handleClose,
    formRef
  };
}
