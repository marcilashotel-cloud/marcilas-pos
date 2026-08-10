import { Link } from 'react-router-dom';
import { ChefHat } from 'lucide-react';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';
  const text =
    size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg';
  const sub = size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-sm' : 'text-xs';

  return (
    <Link to="/" className="flex items-center gap-3 select-none">
      <div
        className={`${dim} rounded-xl bg-primary-600 flex items-center justify-center shadow-sm ring-1 ring-primary-700/20`}
      >
        <ChefHat className="h-1/2 w-1/2 text-white" strokeWidth={2.2} />
      </div>
      <div className="leading-tight">
        <div className={`${text} font-bold tracking-tight text-ink-900`}>
          Marcillas
        </div>
        <div className={`${sub} font-medium uppercase tracking-[0.2em] text-primary-600`}>
          Hotel POS
        </div>
      </div>
    </Link>
  );
}
