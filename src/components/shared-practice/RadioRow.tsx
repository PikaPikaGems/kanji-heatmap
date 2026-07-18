export const RadioRow = <V extends string>({
  name,
  value,
  current,
  label,
  onChange,
}: {
  name: string;
  value: V;
  current: V;
  label: string;
  onChange: (value: V) => void;
}) => (
  <label className="flex items-center gap-2 pr-4 text-sm cursor-pointer">
    <input
      type="radio"
      name={name}
      value={value}
      checked={current === value}
      onChange={() => onChange(value)}
      className="accent-primary"
    />
    {label}
  </label>
);
