import {
  ImagePlus,
  Loader2,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import {
  useRef,
  useState,
  type ChangeEvent,
} from 'react';

import { supabase } from '@/lib/supabase';

const BUCKET_NAME = 'service-images';

type Props = {
  value: string;
  onUpload: (url: string) => void;
  onRemove: () => void;
  disabled?: boolean;
};

export function ServiceImageUpload({
  value,
  onUpload,
  onRemove,
  disabled = false,
}: Props) {
  const inputRef =
    useRef<HTMLInputElement | null>(null);

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] = useState('');

  function openFilePicker() {
    if (disabled || uploading) return;

    inputRef.current?.click();
  }

  async function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) return;

    setError('');

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        'Escolha uma imagem JPG, PNG ou WEBP.'
      );
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(
        'A imagem pode ter no máximo 5 MB.'
      );
      return;
    }

    setUploading(true);

    try {
      const extension =
        file.name
          .split('.')
          .pop()
          ?.toLowerCase() || 'webp';

      const randomId =
        crypto.randomUUID?.() ??
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;

      const filePath =
        `tiragens/${randomId}.${extension}`;

      const { error: uploadError } =
        await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type,
          });

      if (uploadError) {
        console.error(uploadError);

        setError(
          'Não foi possível enviar a imagem.'
        );

        return;
      }

      const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      if (!data?.publicUrl) {
        /*
          Se por algum motivo a URL não for
          gerada, removemos o arquivo que
          acabou de ser enviado.
        */
        await supabase.storage
          .from(BUCKET_NAME)
          .remove([filePath]);

        setError(
          'Não foi possível gerar o endereço da imagem.'
        );

        return;
      }

      onUpload(data.publicUrl);
    } catch (uploadError) {
      console.error(uploadError);

      setError(
        'Ocorreu um erro ao enviar a imagem.'
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={disabled || uploading}
        className="hidden"
      />

      {value ? (
        <div className="overflow-hidden rounded-2xl border border-dourado-200/25 bg-bordo-300/50">
          {/* PRÉVIA */}
          <div className="relative aspect-[16/9] overflow-hidden bg-bordo-300">
            <img
              src={value}
              alt="Imagem da tiragem"
              className="h-full w-full object-cover"
            />

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bordo-300/40 via-transparent to-transparent" />

            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-bordo-300/75 backdrop-blur-sm">
                <div className="flex flex-col items-center">
                  <Loader2 className="h-7 w-7 animate-spin text-dourado-200" />

                  <span className="mt-2 font-serif text-xs text-creme/60">
                    Enviando...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* BOTÕES */}
          <div className="grid grid-cols-2 gap-2 p-3">
            <button
              type="button"
              onClick={openFilePicker}
              disabled={disabled || uploading}
              className="flex items-center justify-center gap-2 rounded-xl border border-dourado-200/25 bg-dourado-200/5 px-3 py-3 font-serif text-xs text-dourado-200 transition-colors hover:bg-dourado-200/10 disabled:opacity-40"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw
                  className="h-4 w-4"
                  strokeWidth={1.5}
                />
              )}

              Trocar imagem
            </button>

            <button
              type="button"
              onClick={onRemove}
              disabled={disabled || uploading}
              className="flex items-center justify-center gap-2 rounded-xl border border-red-300/20 bg-red-400/5 px-3 py-3 font-serif text-xs text-red-300/75 transition-colors hover:bg-red-400/10 disabled:opacity-40"
            >
              <Trash2
                className="h-4 w-4"
                strokeWidth={1.5}
              />

              Remover
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openFilePicker}
          disabled={disabled || uploading}
          className="w-full rounded-2xl border border-dashed border-dourado-200/30 bg-bordo-300/30 px-5 py-8 transition-colors hover:border-dourado-200/50 hover:bg-dourado-200/5 disabled:opacity-40"
        >
          <div className="flex flex-col items-center text-center">
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-dourado-200" />

                <p className="mt-3 font-serif text-sm text-creme/70">
                  Enviando imagem...
                </p>
              </>
            ) : (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-dourado-200/25 bg-dourado-200/5">
                  <ImagePlus
                    className="h-6 w-6 text-dourado-200"
                    strokeWidth={1.4}
                  />
                </div>

                <p className="mt-3 font-serif text-sm text-creme/80">
                  Adicionar imagem da tiragem
                </p>

                <p className="mt-1 font-serif text-[11px] text-creme/40">
                  Clique para escolher uma imagem
                </p>

                <p className="mt-3 font-serif text-[9px] uppercase tracking-[0.15em] text-dourado-200/40">
                  JPG • PNG • WEBP • MÁX. 5 MB
                </p>
              </>
            )}
          </div>
        </button>
      )}

      {error && (
        <div className="rounded-xl border border-red-300/15 bg-red-400/5 px-3 py-2">
          <p className="text-center font-serif text-xs text-red-300/80">
            {error}
          </p>
        </div>
      )}
    </div>
  );
}

/*
  Recebe a URL pública de uma imagem do nosso
  bucket e descobre o caminho interno dela.

  Exemplo:
  https://.../service-images/tiragens/abc.webp

  vira:
  tiragens/abc.webp
*/
export function getServiceImagePath(
  imageUrl: string
) {
  if (!imageUrl) return null;

  try {
    const url = new URL(imageUrl);

    const marker =
      `/object/public/${BUCKET_NAME}/`;

    const markerIndex =
      url.pathname.indexOf(marker);

    if (markerIndex === -1) {
      return null;
    }

    const path =
      url.pathname.slice(
        markerIndex + marker.length
      );

    if (!path) return null;

    return decodeURIComponent(path);
  } catch {
    return null;
  }
}

/*
  Usaremos esta função no AdminPanel.

  IMPORTANTE:
  remover do formulário NÃO chama esta função
  imediatamente.

  O arquivo só será realmente apagado depois
  que a alteração do jogo for salva.
*/
export async function deleteServiceImage(
  imageUrl: string
) {
  const path =
    getServiceImagePath(imageUrl);

  if (!path) {
    return true;
  }

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path]);

  if (error) {
    console.error(
      'Erro ao remover imagem:',
      error
    );

    return false;
  }

  return true;
}
