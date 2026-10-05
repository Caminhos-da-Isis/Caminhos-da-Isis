import { ChevronDown, Moon, Sparkles } from 'lucide-react';

const cartomanteImg = `${import.meta.env.BASE_URL}images/islp-tarot-perfil.png`;

export function Hero() {
  const scrollToConsultas = () => {
    const el = document.getElementById('consultas');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="inicio"
      className="relative min-h-[100svh] flex flex-col items-center justify-center px-5 pt-14 overflow-hidden bg-radial-bordo"
    >
      <div className="absolute inset-0 starfield opacity-50 pointer-events-none" />

      <div
        className="absolute top-20 left-6 animate-twinkle"
        style={{ animationDelay: '0.5s' }}
      >
        <Moon
          className="w-4 h-4 text-dourado-200/40"
          strokeWidth={1.5}
        />
      </div>

      <div
        className="absolute top-32 right-8 animate-twinkle"
        style={{ animationDelay: '1.2s' }}
      >
        <Sparkles
          className="w-3 h-3 text-dourado-200/50"
          strokeWidth={1.5}
        />
      </div>

      <div
        className="absolute bottom-40 left-10 animate-twinkle"
        style={{ animationDelay: '2s' }}
      >
        <Sparkles
          className="w-3 h-3 text-creme/40"
          strokeWidth={1.5}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <h1 className="font-serif text-3xl font-semibold tracking-[0.14em] text-gradient-gold text-shadow-gold animate-fade-in">
          CAMINHOS DE ISIS
        </h1>

        <p
          className="font-serif text-xs tracking-[0.35em] text-dourado-200/70 mt-2 animate-fade-in"
          style={{ animationDelay: '0.2s' }}
        >
          TAROT • ORIENTAÇÃO • CLAREZA
        </p>

        <div
          className="relative mt-8 animate-fade-in"
          style={{ animationDelay: '0.4s' }}
        >
          <div className="absolute -inset-4 rounded-full border border-dourado-200/20" />
          <div className="absolute -inset-2 rounded-full border border-dourado-200/30" />

          <div
            className="relative w-44 h-44 rounded-full overflow-hidden border-2 border-dourado-200/50 gold-glow"
            style={{ fontSize: 0 }}
          >
            <img
              src={cartomanteImg}
              alt="Caminhos de Isis — Cartomante"
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center' }}
              loading="eager"
            />

            <div className="absolute inset-0 rounded-full ring-1 ring-dourado-200/40 pointer-events-none" />
          </div>

          <div className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-dourado-200/60 animate-twinkle" />

          <div
            className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-dourado-200/50 animate-twinkle"
            style={{ animationDelay: '1s' }}
          />
        </div>

        <p
          className="font-serif text-base text-creme/70 mt-8 animate-fade-in"
          style={{ animationDelay: '0.6s' }}
        >
          Seja bem-vindo(a) ao
        </p>

        <h2
          className="font-serif text-2xl font-semibold tracking-[0.12em] text-gradient-gold mt-1 animate-fade-in"
          style={{ animationDelay: '0.7s' }}
        >
          CAMINHOS DE ISIS
        </h2>

        <p
          className="font-serif text-sm tracking-[0.1em] text-dourado-200/80 mt-3 max-w-[300px] animate-fade-in"
          style={{ animationDelay: '0.8s' }}
        >
          "AQUI, CADA PERGUNTA ENCONTRA UM NOVO CAMINHO."
        </p>

        <div
          className="ornament-line w-32 mt-6 animate-fade-in"
          style={{ animationDelay: '0.9s' }}
        />

        <p
          className="font-serif text-[15px] leading-[170%] text-creme/75 mt-6 max-w-[320px] animate-fade-in"
          style={{ animationDelay: '1s' }}
        >
          As cartas são uma ponte entre o que você sente e o que você precisa saber.
          <br />
          <br />
          Estou aqui para te ajudar a enxergar com mais clareza, acolhimento e verdade.
        </p>

        <div
          className="flex flex-col items-center gap-2 mt-7 animate-fade-in"
          style={{ animationDelay: '1.2s' }}
        >
          <span className="font-serif text-[11px] tracking-[0.2em] text-dourado-200/80">
            ATENDIMENTO PERSONALIZADO
          </span>

          <span className="text-dourado-200/40 text-xs">
            •
          </span>

          <span className="font-serif text-[11px] tracking-[0.2em] text-dourado-200/80">
            SIGILO E RESPEITO
          </span>

          <span className="text-dourado-200/40 text-xs">
            •
          </span>

          <span className="font-serif text-[11px] tracking-[0.2em] text-dourado-200/80">
            ORIENTAÇÃO PARA O SEU MOMENTO
          </span>
        </div>

        <button
          onClick={scrollToConsultas}
          className="flex flex-col items-center gap-2 mt-10 animate-fade-in"
          style={{ animationDelay: '1.4s' }}
          aria-label="Descubra o seu caminho"
        >
          <span className="font-serif text-sm tracking-[0.3em] text-gradient-gold font-semibold">
            DESCUBRA O SEU CAMINHO
          </span>

          <ChevronDown
            className="w-6 h-6 text-dourado-200 animate-bounce-slow"
            strokeWidth={1.5}
          />
        </button>
      </div>
    </section>
  );
}
