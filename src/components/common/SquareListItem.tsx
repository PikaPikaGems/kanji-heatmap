export const SquareListItem = ({
  label,
  color,
  cn,
}: {
  label: string;
  color: string;
  cn: string;
}) => {
  return (
    <li className="flex items-center justify-center space-x-1 text-xs font-bold">
      <div className={`${cn} h-4 w-4 rounded-sm`}>
        <span className="sr-only">{color}</span>
      </div>
      <span>{label}</span>
    </li>
  );
};
