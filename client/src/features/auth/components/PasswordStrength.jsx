import { cn } from '@/utils/cn';

const rules = [/.{8,}/, /[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/];
const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
const colors = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500'];

export function PasswordStrength({ password = '' }) {
  const score = rules.filter((rule) => rule.test(password)).length;
  const label = password ? labels[Math.max(0, score - 1)] : 'Enter a new password';

  return (
    <div aria-live="polite" className="mt-2">
      <div
        className="grid grid-cols-5 gap-1"
        role="meter"
        aria-label="Password strength"
        aria-valuemax="5"
        aria-valuemin="0"
        aria-valuenow={score}
      >
        {rules.map((rule, index) => (
          <span
            className={cn('h-1 rounded-full bg-slate-200', index < score && colors[score - 1])}
            key={rule.source}
          />
        ))}
      </div>
      <p className="mt-1.5 text-xs text-slate-500">Password strength: {label}</p>
    </div>
  );
}
