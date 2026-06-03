"use client";

import { useState } from "react";
import { IconMail, IconAlertCircle, IconCheckCircle, IconX } from "./icons";

const MAX_CORREO = 60;

const RecoveryModal = ({ onClose }) => {
    const [correo,  setCorreo]  = useState("");
    const [error,   setError]   = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const validar = () => {
        if (!correo.trim()) {
            setError("El correo no puede estar vacío.");
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correo.trim())) {
            setError("Ingresá un correo electrónico válido.");
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        setError("");
        setSuccess("");
        if (!validar()) return;

        setLoading(true);
        try {
            const response = await fetch("/api/recovery", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ correo: correo.trim().toLowerCase() }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Ocurrió un error. Intentá más tarde.");
                return;
            }

            setSuccess(data.message);
        } catch {
            setError("No se pudo conectar con el servidor.");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleSubmit();
        if (e.key === "Escape") onClose();
    };

    return (
        <div
            className="login-modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="login-modal-card">
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Cerrar"
                    className="login-modal-close"
                >
                    <IconX size={18} />
                </button>

                <img src="/logo.svg" alt="TOTEM" width={48} height={48} className="login-modal-logo" />

                <h2 className="login-modal-title">
                    Recuperar <span className="login-modal-title-accent">contraseña</span>
                </h2>

                <p className="login-modal-subtitle">
                    Ingresá tu correo y te enviaremos un enlace para restablecer tu contraseña.
                </p>

                <label className="login-modal-label">CORREO ELECTRÓNICO</label>
                <div className={`login-modal-input-wrap ${error ? "mb-1" : ""}`}>
                    <span className="login-modal-input-icon">
                        <IconMail />
                    </span>
                    <input
                        type="email"
                        className="login-modal-input with-icon"
                        placeholder="Ingresá tu correo"
                        value={correo}
                        onChange={(e) => {
                            if (e.target.value.length <= MAX_CORREO) {
                                setCorreo(e.target.value);
                                if (error) setError("");
                            }
                        }}
                        onKeyDown={handleKeyDown}
                        maxLength={MAX_CORREO}
                        autoFocus
                        style={error ? { borderColor: "#ef4444" } : undefined}
                    />
                </div>

                {error && (
                    <p className="login-modal-error">
                        <IconAlertCircle size={14} />
                        <span>{error}</span>
                    </p>
                )}

                {success && (
                    <div className="login-modal-success">
                        <span style={{ display: "flex", flexShrink: 0 }}>
                            <IconCheckCircle size={16} />
                        </span>
                        <span>{success}</span>
                    </div>
                )}

                {!success && (
                    <button
                        type="button"
                        className="login-modal-btn-primary"
                        onClick={handleSubmit}
                        disabled={loading}
                        style={{ opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}
                    >
                        {loading ? "Enviando..." : "Enviar enlace →"}
                    </button>
                )}

                {success && (
                    <button
                        type="button"
                        className="login-modal-btn-secondary"
                        onClick={onClose}
                    >
                        Volver al login
                    </button>
                )}

                <div className="login-modal-footer">
                    <div className="dot" />
                    Sistema activo · TOTEM Management Platform
                </div>
            </div>
        </div>
    );
};

export default RecoveryModal;
