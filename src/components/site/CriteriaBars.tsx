import { criteriaLabels, type Criteria } from "@/lib/mock-data";

export function CriteriaBars({ criteria }: { criteria: Criteria }) {
  return (
    <div className="space-y-4">
      {criteriaLabels.map(({ key, label, hint }) => (
        <div key={key}>
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-sm font-medium text-foreground">{label}</span>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {criteria[key].toFixed(1)}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-caramel"
              style={{ width: `${(criteria[key] / 5) * 100}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
        </div>
      ))}
    </div>
  );
}
