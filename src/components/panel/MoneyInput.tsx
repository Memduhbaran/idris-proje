"use client";

import { useState, useEffect } from "react";
import { formatMoneyTL, parseMoneyInput } from "@/lib/money";

type MoneyInputProps = {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  required?: boolean;
  placeholder?: string;
  id?: string;
};

export function MoneyInput({ value, onChange, className = "panel-input", required, placeholder = "0", id }: MoneyInputProps) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    setDisplay(value > 0 ? formatMoneyTL(value) : "");
  }, [value]);

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      required={required}
      placeholder={placeholder}
      className={className}
      value={display}
      onChange={(e) => {
        const parsed = parseMoneyInput(e.target.value);
        onChange(parsed);
        setDisplay(parsed > 0 ? formatMoneyTL(parsed) : "");
      }}
      onBlur={() => {
        setDisplay(value > 0 ? formatMoneyTL(value) : "");
      }}
    />
  );
}
