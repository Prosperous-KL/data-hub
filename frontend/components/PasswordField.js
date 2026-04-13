"use client";

import { useState } from "react";

export default function PasswordField({
  label,
  className = "input",
  containerClassName = "",
  inputClassName = "",
  value,
  onChange,
  placeholder = "Password",
  autoComplete,
  minLength,
  required = false,
  disabled = false,
  name,
  id
}) {
  const [visible, setVisible] = useState(false);
  const inputId = id || name;

  return (
    <div className={containerClassName}>
      {label && <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor={inputId}>{label}</label>}
      <div className="relative">
        <input
          id={inputId}
          name={name}
          className={`${className} pr-16 ${inputClassName}`.trim()}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          minLength={minLength}
          required={required}
          disabled={disabled}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}