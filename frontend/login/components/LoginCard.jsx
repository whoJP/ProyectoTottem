"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import InputField from "./InputField";
import RecoveryModal from "./RecoveryModal";
import { IconUser, IconLock, IconAlertCircle } from "./icons";

const MAX_USUARIO    = 30;
const MIN_CONTRASENA = 8;
const MAX_CONTRASENA = 50;

const LoginCard = () => {
    const router = useRouter();
    const [usuario,    setUsuario]    = useState("");
    const [contrasena, setContrasena] = useState("");
    const [errores,    setErrores]    = useState({ usuario: "", contrasena: "" });
    const [apiError,   setApiError]   = useState("");
    const [loading,    setLoading]    = useState(false);
    const [showRecovery, setShowRecovery] = useState(false);
    const [submitResult, setSubmitResult] = useState(null);
    const [sessionBanner, setSessionBanner] = useState("");

    useEffect(() => {
        const msg = sessionStorage.getItem("login_redirect_message");
        if (msg) {
            setSessionBanner(msg);
            toast.info(msg);
            sessionStorage.removeItem("login_redirect_message");
        }
    }, []);

    const validar = () => {
        const e = { usuario: "", contrasena: "" };
        let ok = true;

        if (!usuario.trim()) {
            e.usuario = "El usuario no puede estar vacío.";
            ok = false;
        } else if (usuario.trim().length > MAX_USUARIO) {
            e.usuario = `Máximo ${MAX_USUARIO} caracteres.`;
            ok = false;
        }

        if (!contrasena) {
            e.contrasena = "La contraseña no puede estar vacía.";
            ok = false;
        } else if (contrasena.length < MIN_CONTRASENA) {
            e.contrasena = `Mínimo ${MIN_CONTRASENA} caracteres.`;
            ok = false;
        } else if (contrasena.length > MAX_CONTRASENA) {
            e.contrasena = `Máximo ${MAX_CONTRASENA} caracteres.`;
            ok = false;
        }

        setErrores(e);
        return ok;
    };

    const buttonClass =
        "button" +
        (submitResult === "error" ? " button--result-error" : "") +
        (submitResult === "success" ? " button--result-success" : "");

    const handleLogin = async () => {
        setApiError("");
        setSubmitResult(null);
        if (!validar()) return;

        setLoading(true);
        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ usuario: usuario.trim(), contrasena }),
            });

            const data = await response.json();

            if (!response.ok) {
                setSubmitResult("error");
                setApiError(data.message || "Credenciales inválidas.");
                return;
            }

            setSubmitResult("success");
            localStorage.setItem("token", data.token);
            localStorage.setItem("admin", JSON.stringify(data.admin));

            // sin env: dashboard en /dashboard. con env absoluto: otro origen
            const raw = process.env.NEXT_PUBLIC_AFTER_LOGIN_URL?.trim();
            const url = raw && raw.length > 0 ? raw : "/dashboard";

            setLoading(false);
            await new Promise((r) => setTimeout(r, 480));
            if (url.startsWith("/")) {
                router.replace(url);
            } else {
                window.location.replace(url);
            }

        } catch {
            setSubmitResult("error");
            setApiError("No se pudo conectar con el servidor. Intentá de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleLogin();
    };

    return (
        <>
            {sessionBanner && (
                <div
                    className="login-session-banner"
                    role="alert"
                >
                    {sessionBanner}
                </div>
            )}
            <div className="login-card">

                <img src="/logo.svg" alt="TOTEM" width={55} height={55} className="logo" />

                <h1 className="title">
                    Panel de Administración <span>TOTEM</span>
                </h1>

                <p className="subtitle">
                    Inicia sesión para administrar los totems.
                </p>

                <InputField
                    label="USUARIO"
                    type="text"
                    placeholder="Ingresa tu usuario"
                    icon={<IconUser />}
                    value={usuario}
                    maxLength={MAX_USUARIO}
                    error={errores.usuario}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => {
                        setUsuario(e.target.value);
                        if (errores.usuario) setErrores((prev) => ({ ...prev, usuario: "" }));
                    }}
                />

                <InputField
                    label="CONTRASEÑA"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    icon={<IconLock />}
                    isPassword={true}
                    value={contrasena}
                    maxLength={MAX_CONTRASENA}
                    error={errores.contrasena}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => {
                        setContrasena(e.target.value);
                        if (errores.contrasena) setErrores((prev) => ({ ...prev, contrasena: "" }));
                    }}
                />

                {apiError && (
                    <div className="login-api-error">
                        <span style={{ display: "flex", flexShrink: 0 }}><IconAlertCircle size={16} /></span>
                        <span>{apiError}</span>
                    </div>
                )}

                <button
                    type="button"
                    className={buttonClass}
                    onClick={handleLogin}
                    disabled={loading}
                >
                    {loading ? "Ingresando..." : "Ingresar →"}
                </button>

                <button
                    type="button"
                    className="link"
                    onClick={() => setShowRecovery(true)}
                >
                    Recuperar contraseña
                </button>

                <div className="footer">
                    <div className="dot" />
                    Sistema activo · TOTEM Management Platform
                </div>

            </div>

            {showRecovery && <RecoveryModal onClose={() => setShowRecovery(false)} />}
        </>
    );
};

export default LoginCard;
