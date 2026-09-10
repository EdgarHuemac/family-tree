import { useEffect, useRef } from "react";

export default function ContextMenu({ x, y, options, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <div ref={ref} className="context-menu" style={{ left: x, top: y }}>
      {options.map((opt) => (
        <button
          key={opt.label}
          className="context-menu__item"
          disabled={opt.disabled}
          title={opt.disabled ? opt.hint : undefined}
          onClick={() => {
            if (opt.disabled) return;
            opt.onSelect();
            onClose();
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
