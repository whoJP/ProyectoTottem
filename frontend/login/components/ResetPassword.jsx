"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

const ResetPassword = () => {
  const params = useParams();
  const router = useRouter();
  const token = typeof params.token === "string" ? params.token : "";

  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setMensaje("");

    if (!nuevaContrasena || !confirmar) {
      setError("Debes completar ambos campos.");
      return;
    }

    if (nuevaContrasena.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (nuevaContrasena !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/recovery/reset-password/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nuevaContrasena }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "No se pudo actualizar la contraseña.");
        return;
      }

      setMensaje(data.message || "Contraseña actualizada correctamente.");
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-card">
      <img src="/logo.svg" alt="TOTEM" width={48} height={48} className="login-modal-logo" />

      <h2 className="login-modal-title">
        Restablecer <span className="login-modal-title-accent">contraseña</span>
      </h2>

      <p className="login-modal-subtitle" style={{ marginBottom: 20 }}>
        Ingresa tu nueva contraseña de acceso.
      </p>

      <label className="login-modal-label">NUEVA CONTRASEÑA</label>
      <input
        type="password"
        className="login-modal-input"
        value={nuevaContrasena}
        onChange={(e) => setNuevaContrasena(e.target.value)}
        placeholder="Mínimo 8 caracteres"
        style={{ marginBottom: 14 }}
      />

      <label className="login-modal-label">CONFIRMAR CONTRASEÑA</label>
      <input
        type="password"
        className="login-modal-input"
        value={confirmar}
        onChange={(e) => setConfirmar(e.target.value)}
        placeholder="Repite la contraseña"
      />

      {error && (
        <p className="login-modal-error" style={{ marginTop: 12 }}>
          {error}
        </p>
      )}

      {mensaje && (
        <div className="login-modal-success" style={{ marginTop: 12 }}>
          {mensaje}
        </div>
      )}

      {!mensaje ? (
        <button
          type="button"
          className="login-modal-btn-primary"
          onClick={handleSubmit}
          disabled={loading}
          style={{
            marginTop: 20,
            opacity: loading ? 0.6 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Actualizando..." : "Guardar nueva contraseña"}
        </button>
      ) : (
        <button
          type="button"
          className="login-modal-btn-secondary"
          onClick={() => router.replace("/login")}
          style={{ marginTop: 20 }}
        >
          Volver al login
        </button>
      )}
    </div>
  );
};

export default ResetPassword;
