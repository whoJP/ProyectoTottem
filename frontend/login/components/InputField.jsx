"use client";

import { useState } from "react";
import { IconEye, IconEyeOff, IconAlertCircle } from "./icons";

const InputField = ({ label, type, placeholder, icon, isPassword, value, onChange, onKeyDown, error, maxLength }) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div>
            <label className="label">{label}</label>
            <div className="input-group" style={{ marginBottom: error ? "4px" : "20px" }}>
                {icon != null && <span className="icon">{icon}</span>}
                <input
                    type={isPassword ? (showPassword ? "text" : "password") : type}
                    placeholder={placeholder}
                    className="input"
                    value={value}
                    onChange={onChange}
                    onKeyDown={onKeyDown}
                    maxLength={maxLength}
                    style={error ? { borderColor: "#ff4d4d", borderWidth: "1px", borderStyle: "solid" } : {}}
                    autoComplete={isPassword ? "current-password" : "username"}
                />
                {isPassword && (
                    <button
                        type="button"
                        className="eye"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                        {showPassword ? <IconEyeOff /> : <IconEye />}
                    </button>
                )}
            </div>
            {error && (
                <p
                    style={{
                        color: "#ff4d4d",
                        fontSize: "11px",
                        marginBottom: "14px",
                        paddingLeft: "2px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                    }}
                >
                    <IconAlertCircle size={14} />
                    <span>{error}</span>
                </p>
            )}
        </div>
    );
};

export default InputField;
