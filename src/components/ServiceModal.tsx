import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { Service } from '@/data/services';

export function ServiceModal({
  service,
  onClose,
}: {
  service: Service;
  onClose: () => void;
}) {
  useEffect(() => {
    document.body.style.overflow =
      'hidden';

    return () => {
      document.body.style.overflow =
        '';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      <div className="relative flex max-h-[85vh] w-full max-w-[480px] flex-col rounded-2xl border-2 border-dourado-200/40 bg-bordo-200 animate-fade-up">
        <div className="flex shrink-0 items-center justify-between border-b border-dourado-200/20 px-5 py-4">
          <div className="flex items-center gap-2">
            <service.icon
              className="h-5 w-5 text-dourado-200"
              strokeWidth={1.5}
            />

            <span className="font-serif text-sm tracking-[0.1em] text-dourado-200/80">
              DETALHES DA LEITURA
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-dourado-200/70 transition-colors hover:text-dourado-100"
            aria-label="Fechar"
          >
            <X
              className="h-6 w-6"
              strokeWidth={1.5}
            />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-6">
          <h3 className="mb-4 font-serif text-2xl font-semibold text-gradient-gold">
            {service.name}
          </h3>

          <div className="mb-5 flex items-center gap-3">
            <span className="font-serif text-3xl font-semibold text-dourado-200">
              {service.price}
            </span>
          </div>

          <div className="ornament-line mb-5 w-full" />

          <p className="font-serif text-base leading-[170%] text-creme/80">
            {service.details ??
              service.description}
          </p>

          {service.details && (
            <p className="mt-4 font-serif text-[15px] leading-[170%] text-creme/60">
              {
                service.description
              }
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
