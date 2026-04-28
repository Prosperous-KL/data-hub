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
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
        >
          {visible ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7c1.295 0 2.528.258 3.675.73" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}