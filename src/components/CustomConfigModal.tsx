"use client";

import { Check, Settings2, X } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";

export type CustomConfigType =
  | "words"
  | "letters"
  | "time"
  | "chunk"
  | "flash"
  | "rounds"
  | null;

interface CustomConfigModalProps {
  isOpen: boolean;
  type: CustomConfigType;
  currentValue: number;
  onClose: () => void;
  onSave: (type: NonNullable<CustomConfigType>, value: number) => void;
}

export const CustomConfigModal: React.FC<CustomConfigModalProps> = ({
  isOpen,
  type,
  currentValue,
  onClose,
  onSave,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && type) {
      if (type === "flash") {
        setInputValue((currentValue / 1000).toString());
      } else {
        setInputValue(currentValue.toString());
      }
      setErrorMsg(null);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, type, currentValue]);

  if (!isOpen || !type) return null;

  const getMeta = () => {
    switch (type) {
      case "words":
        return {
          title: "Custom Word Count",
          desc: "Target words to type in one session (e.g. 120, 130, 200).",
          unit: "words",
          min: 5,
          max: 1000,
          step: 5,
          presets: [15, 25, 50, 100, 120, 130, 150, 200],
        };
      case "letters":
        return {
          title: "Custom Letter Count",
          desc: "Target single characters to type in one session (e.g. 50, 100, 200).",
          unit: "letters",
          min: 10,
          max: 1000,
          step: 10,
          presets: [25, 50, 100, 150, 200],
        };
      case "time":
        return {
          title: "Custom Time Duration",
          desc: "Target duration before session finishes.",
          unit: "seconds",
          min: 5,
          max: 600,
          step: 5,
          presets: [15, 30, 45, 60, 90, 120, 180],
        };
      case "chunk":
        return {
          title: "Custom Chunk Size",
          desc: "Number of words flashed per memory round.",
          unit: "words",
          min: 2,
          max: 12,
          step: 1,
          presets: [2, 3, 4, 5, 6, 7, 8],
        };
      case "flash":
        return {
          title: "Custom Flash Duration",
          desc: "Seconds words remain visible before fading.",
          unit: "seconds",
          min: 0.5,
          max: 10,
          step: 0.1,
          presets: [0.8, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0],
        };
      case "rounds":
        return {
          title: "Custom Total Rounds",
          desc: "Total flash & type rounds in this session.",
          unit: "rounds",
          min: 1,
          max: 30,
          step: 1,
          presets: [3, 5, 8, 10, 15, 20],
        };
    }
  };

  const meta = getMeta();

  const handleApply = (valueToUse?: number) => {
    const rawNum =
      valueToUse !== undefined ? valueToUse : Number.parseFloat(inputValue);

    if (Number.isNaN(rawNum)) {
      setErrorMsg("Please enter a valid numeric value.");
      return;
    }

    if (rawNum < meta.min || rawNum > meta.max) {
      setErrorMsg(`Value must be between ${meta.min} and ${meta.max}.`);
      return;
    }

    let finalValue = rawNum;
    if (type === "flash") {
      finalValue = Math.round(rawNum * 1000);
    } else {
      finalValue = Math.round(rawNum);
    }

    onSave(type, finalValue);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleApply();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-mono select-none animate-fadeIn">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-default"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-md rounded-2xl border shadow-2xl p-6 flex flex-col gap-5 transition-all"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-color)",
          color: "var(--text-main)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-[var(--color-primary)]" />
            <h3 className="font-bold text-sm">{meta.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--bg-sub)] transition-colors opacity-70 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[var(--text-dim)]">{meta.desc}</p>

        {/* Input & Unit */}
        <div className="flex flex-col gap-1.5">
          <div
            className="flex items-center rounded-xl border px-3 py-2 text-lg font-bold"
            style={{
              backgroundColor: "var(--bg-sub)",
              borderColor: errorMsg
                ? "var(--color-error)"
                : "var(--border-color)",
            }}
          >
            <input
              ref={inputRef}
              type="number"
              value={inputValue}
              min={meta.min}
              max={meta.max}
              step={meta.step}
              onChange={(e) => {
                setInputValue(e.target.value);
                setErrorMsg(null);
              }}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent outline-none text-[var(--color-primary)] font-mono"
            />
            <span className="text-xs font-medium text-[var(--text-dim)] ml-2">
              {meta.unit}
            </span>
          </div>

          {errorMsg && (
            <span className="text-[11px] text-[var(--color-error)]">
              {errorMsg}
            </span>
          )}
        </div>

        {/* Quick Presets */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-dim)]">
            Quick Presets
          </span>
          <div className="flex flex-wrap gap-1.5">
            {meta.presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setInputValue(preset.toString());
                  handleApply(preset);
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all hover:border-[var(--color-primary)]"
                style={{
                  backgroundColor: "var(--bg-sub)",
                  borderColor: "var(--border-color)",
                  color: "var(--text-main)",
                }}
              >
                {type === "flash" ? `${preset}s` : preset}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[var(--bg-sub)] transition-colors text-[var(--text-dim)]"
          >
            Cancel [esc]
          </button>
          <button
            type="button"
            onClick={() => handleApply()}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "var(--bg-main)",
            }}
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply [enter]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
