import { MessageCircle, Moon, Instagram } from 'lucide-react';
import { WHATSAPP_NUMBER } from '@/data/services';

export function Footer() {
  return (
    <footer
      id="contato"
      className="relative px-5 py-14 bg-bordo-400 border-t border-dourado-200/15"
    >
      <div className="flex flex-col items-center text-center">
        <Moon
          className="w-6 h-6 text-dourado-200/70 mb-3"
          strokeWidth={1.5}
        />

        <h3 className="font-serif text-xl font-semibold tracking-[0.16em] text-gradient-gold">
          CAMINHOS DE ISIS
        </h3>

        <a
          href="https://instagram.com/ISLP_TAROT"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 mt-4 font-serif text-base text-creme/80 hover:text-dourado-200 transition-colors"
        >
          <Instagram
            className="w-4 h-4"
            strokeWidth={1.5}
          />
          @ISLP_TAROT
        </a>

        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 mt-3 font-serif text-sm text-creme/60 hover:text-dourado-200 transition-colors"
        >
          <MessageCircle
            className="w-4 h-4"
            strokeWidth={1.5}
          />
          Atendimento pelo WhatsApp
        </a>

        <div className="ornament-line w-24 mt-6" />

        <p className="font-serif text-xs tracking-[0.2em] text-dourado-200/50 mt-4">
          Tarot • Orientação • Clareza
        </p>
      </div>
    </footer>
  );
}
