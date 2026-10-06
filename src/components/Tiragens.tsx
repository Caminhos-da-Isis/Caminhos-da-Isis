import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Check,
  Eye,
  Heart,
  Info,
  Loader2,
  MessageCircle,
  MoonStar,
  ShoppingBag,
  Sparkles,
  UserRound,
  UsersRound,
  WalletCards,
} from 'lucide-react';

import {
  buildWhatsAppLink,
  type Service,
} from '@/data/services';

import { useReveal } from '@/hooks/useReveal';
import { ServiceModal } from './ServiceModal';
import { supabase } from '@/lib/supabase';
import { addToCart } from '@/hooks/useCart';

type ServiceArea =
  | 'geral'
  | 'amor'
  | 'financeiro'
  | 'pessoal'
  | 'espiritual'
  | 'relacionamentos';

type FilterArea =
  | 'todos'
  | ServiceArea;

type DatabaseService = {
  id: number;
  nome: string;
  preco: number;
  descricao: string;

  categoria:
    | 'consulta'
    | 'tiragem';

  area:
    | ServiceArea
    | null;

  imagem_url:
    | string
    | null;

  quantidade_cartas:
    | number
    | null;

  tem_carta_fundo: boolean;

  ativo: boolean;
  destaque: boolean;
  ordem: number;
};

const filters: Array<{
  value: FilterArea;
  label: string;
}> = [
  {
    value: 'todos',
    label: 'Todos',
  },
  {
    value: 'amor',
    label: 'Amor',
  },
  {
    value: 'financeiro',
    label: 'Financeiro',
  },
  {
    value: 'pessoal',
    label: 'Pessoal',
  },
  {
    value: 'espiritual',
    label: 'Espiritual',
  },
  {
    value: 'relacionamentos',
    label: 'Relacionamentos',
  },
  {
    value: 'geral',
    label: 'Geral',
  },
];

export function Tiragens() {
  const { ref, visible } =
    useReveal<HTMLDivElement>();

  const [
    tiragens,
    setTiragens,
  ] = useState<
    DatabaseService[]
  >([]);

  const [
    selected,
    setSelected,
  ] = useState<
    Service | null
  >(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    activeFilter,
    setActiveFilter,
  ] =
    useState<FilterArea>(
      'todos'
    );

  useEffect(() => {
    loadTiragens();

    function handleServicesUpdated() {
      loadTiragens();
    }

    document.addEventListener(
      'services-updated',
      handleServicesUpdated
    );

    return () => {
      document.removeEventListener(
        'services-updated',
        handleServicesUpdated
      );
    };
  }, []);

  async function loadTiragens() {
    setLoading(true);

    const {
      data,
      error,
    } = await supabase
      .from('services')
      .select(
        'id, nome, preco, descricao, categoria, area, imagem_url, quantidade_cartas, tem_carta_fundo, ativo, destaque, ordem'
      )
      .eq(
        'categoria',
        'tiragem'
      )
      .eq(
        'ativo',
        true
      )
      .order('ordem', {
        ascending: true,
      });

    if (error) {
      console.error(
        'Erro ao carregar tiragens:',
        error
      );

      setTiragens([]);
    } else {
      setTiragens(
        (data ??
          []) as DatabaseService[]
      );
    }

    setLoading(false);
  }

  const filteredTiragens =
    useMemo(() => {
      if (
        activeFilter ===
        'todos'
      ) {
        return tiragens;
      }

      return tiragens.filter(
        (tiragem) =>
          (tiragem.area ??
            'geral') ===
          activeFilter
      );
    }, [
      tiragens,
      activeFilter,
    ]);

  function convertToService(
    service: DatabaseService
  ): Service {
    const price =
      formatPrice(
        service.preco
      );

    return {
      id: String(
        service.id
      ),

      name:
        service.nome,

      price,

      priceValue:
        Number(
          service.preco
        ),

      description:
        service.descricao,

      icon:
        getAreaIcon(
          service.area ??
            'geral'
        ),
    };
  }

  return (
    <section
      id="tiragens"
      className="relative overflow-hidden bg-bordo-200 px-5 py-16"
    >
      <div
        ref={ref}
        className={`flex flex-col items-center text-center ${
          visible
            ? 'is-visible'
            : 'reveal'
        }`}
      >
        <div className="mb-3 flex items-center gap-3">
          <div className="ornament-line w-12" />

          <div className="h-1.5 w-1.5 rounded-full bg-dourado-200/60" />

          <div className="ornament-line w-12" />
        </div>

        <h2 className="font-serif text-2xl font-semibold tracking-[0.15em] text-gradient-gold">
          ESCOLHA SUA TIRAGEM
        </h2>

        <p className="mt-3 max-w-[330px] font-serif text-[13px] leading-relaxed text-creme/45">
          Encontre a leitura ideal
          para o momento que você
          está vivendo.
        </p>
      </div>

      {/* FILTROS */}
      <div className="relative -mx-5 mt-7">
        <div className="flex gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filters.map(
            (filter) => {
              const active =
                activeFilter ===
                filter.value;

              return (
                <button
                  key={
                    filter.value
                  }
                  type="button"
                  onClick={() =>
                    setActiveFilter(
                      filter.value
                    )
                  }
                  className={`shrink-0 rounded-full border px-4 py-2 font-serif text-[11px] tracking-[0.04em] transition-all duration-300 active:scale-95 ${
                    active
                      ? 'border-dourado-200/70 bg-dourado-200 text-bordo-300 shadow-[0_0_20px_rgba(212,175,55,0.12)]'
                      : 'border-dourado-200/20 bg-bordo-300/35 text-creme/55 hover:border-dourado-200/40 hover:text-dourado-200'
                  }`}
                >
                  {
                    filter.label
                  }
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* CARREGANDO */}
      {loading && (
        <div className="flex justify-center py-14">
          <Loader2
            className="h-5 w-5 animate-spin text-dourado-200/50"
            strokeWidth={1.5}
          />
        </div>
      )}

      {/* VAZIO */}
      {!loading &&
        filteredTiragens.length ===
          0 && (
          <div className="mt-10 rounded-2xl border border-dourado-200/15 bg-bordo-300/25 px-5 py-10 text-center">
            <Sparkles
              className="mx-auto h-5 w-5 text-dourado-200/40"
              strokeWidth={1.4}
            />

            <p className="mt-3 font-serif text-sm text-creme/50">
              Nenhuma tiragem nesta
              categoria ainda.
            </p>
          </div>
        )}

      {/* CARDS */}
      {!loading &&
        filteredTiragens.length >
          0 && (
          <div className="mt-8 grid grid-cols-2 items-stretch gap-3">
            {filteredTiragens.map(
              (
                tiragem,
                index
              ) => {
                const service =
                  convertToService(
                    tiragem
                  );

                return (
                  <TiragemCard
                    key={
                      tiragem.id
                    }
                    databaseService={
                      tiragem
                    }
                    service={
                      service
                    }
                    delay={
                      index *
                      0.06
                    }
                    onDetails={() =>
                      setSelected(
                        service
                      )
                    }
                  />
                );
              }
            )}
          </div>
        )}

      {selected && (
        <ServiceModal
          service={selected}
          onClose={() =>
            setSelected(null)
          }
        />
      )}
    </section>
  );
}

function TiragemCard({
  databaseService,
  service,
  delay,
  onDetails,
}: {
  databaseService:
    DatabaseService;

  service: Service;

  delay: number;

  onDetails: () => void;
}) {
  const { ref, visible } =
    useReveal<HTMLDivElement>();

  const [
    added,
    setAdded,
  ] = useState(false);

  const [
    imageError,
    setImageError,
  ] = useState(false);

  const [
    infoOpen,
    setInfoOpen,
  ] = useState(false);

  const area =
    databaseService.area ??
    'geral';

  const AreaIcon =
    getAreaIcon(area);

  const hasImage =
    Boolean(
      databaseService.imagem_url
    ) &&
    !imageError;

  const hasCardInfo =
    databaseService.quantidade_cartas != null &&
    databaseService.quantidade_cartas > 0;

  function handleAddToCart() {
    addToCart({
      id:
        databaseService.id,

      nome:
        databaseService.nome,

      preco:
        Number(
          databaseService.preco
        ),

      categoria:
        databaseService.categoria,
    });

    setAdded(true);

    window.setTimeout(
      () => {
        setAdded(false);
      },
      1500
    );
  }

  return (
    <article
      ref={ref}
      className={`group relative flex min-w-0 flex-col overflow-hidden rounded-[18px] border border-dourado-200/20 bg-gradient-to-b from-bordo-100/85 to-bordo-400/80 shadow-[0_14px_35px_rgba(0,0,0,0.12)] ${
        visible
          ? 'is-visible'
          : 'reveal'
      }`}
      style={{
        animationDelay:
          `${delay}s`,
      }}
    >

      {/* ==========================================
          IMAGEM DA TIRAGEM
      ========================================== */}

      <div className="relative h-[112px] overflow-hidden border-b border-dourado-200/10 bg-bordo-300/60">

        {hasImage ? (
          <>
            <img
              src={
                databaseService.imagem_url!
              }
              alt={
                databaseService.nome
              }
              loading="lazy"
              onError={() =>
                setImageError(true)
              }
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />

            {/* SOMBRA PARA DAR CONTRASTE */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bordo-400/55 via-transparent to-black/10" />

            {/* LEVE VINHETA */}
            <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_25px_rgba(0,0,0,0.18)]" />
          </>
        ) : (
          <>
            {/* FALLBACK ANTIGO */}
            <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full border border-dourado-200/10" />

            <div className="absolute -bottom-14 -left-8 h-32 w-32 rounded-full border border-dourado-200/10" />

            <div className="absolute inset-0 bg-gradient-to-br from-dourado-200/[0.08] via-transparent to-bordo-400/40" />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-dourado-200/30 bg-bordo-300/70 shadow-[0_0_28px_rgba(212,175,55,0.10)]">

                <div className="absolute inset-[5px] rounded-full border border-dourado-200/10" />

                <AreaIcon
                  className="h-6 w-6 text-dourado-200/85"
                  strokeWidth={1.25}
                />
              </div>
            </div>
          </>
        )}

        {/* CATEGORIA */}
        <span className="absolute left-2.5 top-2.5 z-10 rounded-full border border-dourado-200/25 bg-bordo-400/80 px-2 py-1 font-serif text-[8px] uppercase tracking-[0.12em] text-dourado-200 backdrop-blur-sm shadow-[0_2px_10px_rgba(0,0,0,0.25)]">
          {formatArea(area)}
        </span>

        {/* INFORMAÇÕES DAS CARTAS */}
        {hasCardInfo && (
          <div className={`absolute right-2.5 z-20 ${databaseService.destaque ? 'top-10' : 'top-2.5'}`}>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setInfoOpen((current) => !current);
              }}
              aria-label="Informações da tiragem"
              aria-expanded={infoOpen}
              className="flex h-6 w-6 items-center justify-center rounded-full border border-dourado-200/35 bg-bordo-400/90 text-dourado-200 backdrop-blur-sm shadow-[0_2px_10px_rgba(0,0,0,0.3)]"
            >
              <Info className="h-3.5 w-3.5" strokeWidth={1.8} />
            </button>

            {infoOpen && (
              <div className="absolute right-0 top-8 w-[145px] rounded-xl border border-dourado-200/25 bg-bordo-400/95 px-3 py-2.5 text-left shadow-[0_10px_30px_rgba(0,0,0,0.4)] backdrop-blur-md">
                <p className="font-serif text-[10px] leading-relaxed text-creme/80">
                  {databaseService.quantidade_cartas}{' '}
                  {databaseService.quantidade_cartas === 1 ? 'carta' : 'cartas'}
                  {databaseService.tem_carta_fundo ? ' + 1 carta de fundo' : ''}
                </p>
              </div>
            )}
          </div>
        )}

        {/* DESTAQUE */}
        {databaseService.destaque && (
          <span className="absolute right-2.5 top-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-dourado-200/25 bg-bordo-400/80 text-[11px] text-dourado-200 backdrop-blur-sm shadow-[0_2px_10px_rgba(0,0,0,0.25)]">
            ✦
          </span>
        )}
      </div>

      {/* ==========================================
          CONTEÚDO DO CARD
      ========================================== */}

      <div className="flex flex-1 flex-col p-3.5">

        <h3 className="min-h-[42px] font-serif text-[16px] font-medium leading-[1.28] text-creme">
          {service.name}
        </h3>

        <p className="mt-2 line-clamp-3 min-h-[54px] font-serif text-[11px] leading-[1.55] text-creme/50">
          {
            service.description
          }
        </p>

        {/* PREÇO */}
        <div className="mt-3 border-t border-dourado-200/10 pt-3">
          <span className="font-serif text-xl font-semibold text-gradient-gold">
            {service.price}
          </span>
        </div>

        {/* DETALHES */}
        <button
          type="button"
          onClick={onDetails}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-full border border-dourado-200/25 px-2 py-2 font-sans text-[9px] tracking-[0.05em] text-dourado-200/80 transition-all duration-300 hover:border-dourado-200/50 hover:text-dourado-100 active:scale-95"
        >
          <Eye
            className="h-3 w-3"
            strokeWidth={1.5}
          />

          Ver detalhes
        </button>

        {/* CARRINHO */}
        <button
          type="button"
          onClick={
            handleAddToCart
          }
          className={`mt-2 flex w-full items-center justify-center gap-1.5 rounded-full px-2 py-2.5 font-sans text-[9px] font-semibold tracking-[0.04em] transition-all duration-300 active:scale-[0.98] ${
            added
              ? 'border border-dourado-200/35 bg-dourado-200/10 text-dourado-200'
              : 'bg-dourado-200/90 text-bordo-300 hover:bg-dourado-100'
          }`}
        >
          {added ? (
            <>
              <Check
                className="h-3.5 w-3.5"
                strokeWidth={2}
              />

              ADICIONADO
            </>
          ) : (
            <>
              <ShoppingBag
                className="h-3.5 w-3.5"
                strokeWidth={2}
              />

              ADICIONAR
            </>
          )}
        </button>

        {/* WHATSAPP */}
        <a
          href={buildWhatsAppLink(
            service.name,
            service.price
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex items-center justify-center gap-1 py-1 font-serif text-[9px] leading-tight text-creme/35 transition-colors duration-300 hover:text-dourado-200"
        >
          <MessageCircle
            className="h-3 w-3 shrink-0"
            strokeWidth={1.5}
          />

          WhatsApp
        </a>
      </div>
    </article>
  );
}

function getAreaIcon(
  area: ServiceArea
) {
  switch (area) {
    case 'amor':
      return Heart;

    case 'financeiro':
      return WalletCards;

    case 'pessoal':
      return UserRound;

    case 'espiritual':
      return MoonStar;

    case 'relacionamentos':
      return UsersRound;

    default:
      return Sparkles;
  }
}

function formatArea(
  area: ServiceArea
) {
  const labels: Record<
    ServiceArea,
    string
  > = {
    geral: 'Geral',

    amor: 'Amor',

    financeiro:
      'Financeiro',

    pessoal: 'Pessoal',

    espiritual:
      'Espiritual',

    relacionamentos:
      'Relacionamentos',
  };

  return labels[area];
}

function formatPrice(
  value: number
) {
  return Number(
    value
  ).toLocaleString(
    'pt-BR',
    {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  );
}