"use client";

type DropdownProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function Dropdown({ value, onChange }: DropdownProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex-1 min-w-0 rounded-md border border-panel-border bg-[#0e0e12] px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      aria-label="Demo questions"
    >
      <option value="" disabled>
        Select demo question…
      </option>
    </select>
  );
}
