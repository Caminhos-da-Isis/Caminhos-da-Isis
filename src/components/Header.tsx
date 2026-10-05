import { useEffect, useState } from 'react';
import {
  LogIn,
  LogOut,
  Menu,
  Moon,
  PackageCheck,
  ShoppingBag,
  ShieldCheck,
  Star,
  UserRound,
  X,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { menuItems } from '@/data/services';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/hooks/useCart';

const adminAvatar = `${import.meta.env.BASE_URL}images/monster%20high.png`;

type Profile = {
  nome: string;
  username: string | null;
  role: 'cliente' | 'admin';
};

export function Header() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const { quantidadeTotal } = useCart();

  useEffect(() => {
    async function loadSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const currentUser = session?.user ?? null;

      setUser(currentUser);

      if (currentUser) {
        await loadProfile(currentUser.id);
      } else {
        setProfile(null);
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;

      setUser(currentUser);

      if (currentUser) {
        setTimeout(() => {
          loadProfile(currentUser.id);
        }, 0);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('nome, username, role')
      .eq('id', userId)
      .single();

    if (data) {
      setProfile(data as Profile);
    }
  }

  function handleNav(href: string) {
    setOpen(false);

    setTimeout(() => {
      const el = document.getElementById(href);

      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  function handleLogin() {
    setOpen(false);

    setTimeout(() => {
      document.dispatchEvent(new CustomEvent('open-login'));
    }, 150);
  }

  function handleReview() {
    setOpen(false);

    setTimeout(() => {
      document.dispatchEvent(new CustomEvent('open-review-auth'));
    }, 150);
  }

  function handleMyOrders() {
    setOpen(false);

    setTimeout(() => {
      document.dispatchEvent(new CustomEvent('open-my-orders'));
    }, 150);
  }

  function handleAdmin() {
    setOpen(false);

    setTimeout(() => {
      document.dispatchEvent(new CustomEvent('open-admin-panel'));
    }, 150);
  }

  function handleCart() {
    setOpen(false);

    setTimeout(() => {
      document.dispatchEvent(new CustomEvent('open-cart'));
    }, 100);
  }

  async function handleLogout() {
    await supabase.auth.signOut();

    setUser(null);
    setProfile(null);
    setOpen(false);
  }

  const isAdmin = profile?.role === 'admin';

  const displayName =
    profile?.nome ||
    user?.user_metadata?.nome ||
    'Cliente';

  return (
    <>
      <header className="fixed top-0 left-1/2 -translate-x-1/2 z-40 w-full max-w-[480px] bg-bordo-300/95 backdrop-blur-md border-b border-dourado-200/15">
        <div className="flex items-center justify-between px-5 h-14">
          <button
            onClick={() => handleNav('inicio')}
            className="flex items-center gap-2"
            aria-label="Caminhos da Isis — Início"
          >
            <Moon
              className="w-5 h-5 text-dourado-200"
              strokeWidth={1.5}
            />

            <span className="font-serif text-lg tracking-[0.12em] text-gradient-gold font-semibold">
              CAMINHOS DA ISIS
            </span>
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleCart}
              className="relative p-2 text-dourado-200"
              aria-label="Abrir carrinho"
            >
              <ShoppingBag
                className="w-5 h-5"
                strokeWidth={1.5}
              />

              {quantidadeTotal > 0 && (
                <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-dourado-200 px-1 font-serif text-[9px] font-bold text-bordo-300">
                  {quantidadeTotal > 99
                    ? '99+'
                    : quantidadeTotal}
                </span>
              )}
            </button>

            <button
              onClick={() => setOpen(true)}
              className="p-2 -mr-2 text-dourado-200"
              aria-label="Abrir menu"
            >
              <Menu
                className="w-6 h-6"
                strokeWidth={1.5}
              />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-end"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <nav className="relative w-full max-w-[480px] h-full bg-bordo-200 border-l border-dourado-200/20 flex flex-col animate-fade-in overflow-y-auto">
            <div className="flex items-center justify-between px-5 h-14 min-h-14 border-b border-dourado-200/15">
              <span className="font-serif text-lg tracking-[0.15em] text-gradient-gold font-semibold">
                MENU
              </span>

              <button
                onClick={() => setOpen(false)}
                className="p-2 -mr-2 text-dourado-200"
                aria-label="Fechar menu"
              >
                <X
                  className="w-6 h-6"
                  strokeWidth={1.5}
                />
              </button>
            </div>

            <ul className="flex flex-col px-5 py-4">
              {menuItems.map((item, i) => (
                <li
                  key={item.href}
                  className="border-b border-dourado-200/8"
                >
                  <button
                    onClick={() => handleNav(item.href)}
                    className="w-full text-left py-4 font-serif text-2xl text-creme/90 hover:text-dourado-200 transition-colors duration-300"
                    style={{
                      animation: `fadeUp 0.4s ease-out ${
                        i * 0.06
                      }s both`,
                    }}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>

            <div className="px-5 mt-2">
              <div className="ornament-line w-full mb-5" />

              {!user ? (
                <button
                  type="button"
                  onClick={handleLogin}
                  className="w-full flex items-center gap-4 rounded-xl border border-dourado-200/20 bg-bordo-300/30 px-4 py-4 text-left transition-all duration-300 hover:border-dourado-200/40 hover:bg-bordo-300/50"
                >
                  <div className="w-10 h-10 rounded-full border border-dourado-200/25 flex items-center justify-center">
                    <LogIn
                      className="w-5 h-5 text-dourado-200/70"
                      strokeWidth={1.4}
                    />
                  </div>

                  <div>
                    <p className="font-serif text-base text-creme/90">
                      Entrar
                    </p>

                    <p className="font-serif text-xs text-creme/40 mt-1">
                      Acesse sua conta
                    </p>
                  </div>
                </button>
              ) : (
                <div>
                  <div className="flex items-center gap-4 px-1 pb-5">
                    <div className="relative w-12 h-12 rounded-full border border-dourado-200/30 bg-bordo-300 flex items-center justify-center overflow-hidden">
                      {isAdmin ? (
                        <img
                          src={adminAvatar}
                          alt="Isis"
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <UserRound
                          className="w-6 h-6 text-dourado-200/65"
                          strokeWidth={1.3}
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-serif text-lg text-creme/90 truncate">
                          {displayName}
                        </p>

                        {isAdmin && (
                          <span className="text-dourado-200 text-xs">
                            ✦
                          </span>
                        )}
                      </div>

                      <p className="font-serif text-[11px] tracking-[0.15em] text-dourado-200/55 uppercase mt-1">
                        {isAdmin
                          ? 'Administradora'
                          : 'Minha conta'}
                      </p>
                    </div>
                  </div>

                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={handleAdmin}
                      className="w-full flex items-center gap-3 rounded-xl border border-dourado-200/30 bg-dourado-200/5 px-4 py-3.5 font-serif text-sm text-dourado-200 transition-all duration-300 hover:bg-dourado-200/10"
                    >
                      <ShieldCheck
                        className="w-4 h-4"
                        strokeWidth={1.4}
                      />

                      Painel administrativo
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={handleMyOrders}
                        className="w-full flex items-center gap-3 rounded-xl border border-dourado-200/25 bg-dourado-200/5 px-4 py-3.5 font-serif text-sm text-dourado-200 transition-all duration-300 hover:bg-dourado-200/10"
                      >
                        <PackageCheck
                          className="w-4 h-4"
                          strokeWidth={1.4}
                        />

                        Meus pedidos
                      </button>

                      <button
                        type="button"
                        onClick={handleReview}
                        className="w-full flex items-center gap-3 rounded-xl border border-dourado-200/25 bg-dourado-200/5 px-4 py-3.5 font-serif text-sm text-dourado-200 transition-all duration-300 hover:bg-dourado-200/10"
                      >
                        <Star
                          className="w-4 h-4"
                          strokeWidth={1.4}
                        />

                        Deixar avaliação
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-4 mt-1 font-serif text-sm text-creme/45 transition-colors duration-300 hover:text-creme/75"
                  >
                    <LogOut
                      className="w-4 h-4"
                      strokeWidth={1.4}
                    />

                    Sair
                  </button>
                </div>
              )}
            </div>

            <div className="mt-auto px-5 py-6">
              <div className="ornament-line w-full mb-4" />

              <p className="font-serif text-sm tracking-[0.2em] text-dourado-200/60 text-center">
                TAROT • ORIENTAÇÃO • CLAREZA
              </p>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
