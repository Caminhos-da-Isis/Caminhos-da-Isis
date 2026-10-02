import {
  ImagePlus,
  Loader2,
  Trash2,
} from 'lucide-react';
import {
  ChangeEvent,
  useRef,
  useState,
} from 'react';
import { supabase } from '@/lib/supabase';

type ServiceImageUploadProps = {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
};

const BUCKET_NAME = 'service-images';

export function ServiceImageUpload({
  value,
  onChange,
  disabled = false,
}: ServiceImageUploadProps) {
  const inputRef =
    useRef<HTMLInputElement | null>(null);

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] = useState('');

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
        'Use uma imagem JPG, PNG ou WEBP.'
      );
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(
        'A imagem precisa ter no máximo 5 MB.'
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

      const randomPart =
        Math.random()
          .toString(36)
          .slice(2, 10);

      const fileName =
        `${Date.now()}-${randomPart}.${extension}`;

      const filePath =
        `tiragens/${fileName}`;

      const {
        error: uploadError,
      } = await supabase.storage
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

        setUploading(false);
        return;
      }

      const {
        data: publicUrlData,
      } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        setError(
          'Não foi possível obter o endereço da imagem.'
        );

        setUploading(false);
        return;
      }

      onChange(publicUrlData.publicUrl);
    } catch (uploadError) {
      console.error(uploadError);

      setError(
        'Ocorreu um erro ao enviar a imagem.'
      );
    } finally {
      setUploading(false);
    }
  }

  function handleSelectImage() {
    if (disabled || uploading) return;

    inputRef.current?.click();
  }

  function handleRemoveImage() {
    if (disabled || uploading) return;

    onChange('');
    setError('');
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
        <div className="relative overflow-hidden rounded-2xl border border-dourado-200/25 bg-bordo-300">
          <div className="relative aspect-[16/9] overflow-hidden">
            <img
              src={value}
              alt="Imagem da tiragem"
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-bordo-300/60 via-transparent to-transparent" />
          </div>

          <div className="grid grid-cols-2 gap-2 p-3">
            <button
              type="button"
              onClick={handleSelectImage}
              disabled={
                disabled || uploading
              }
              className="flex items-center justify-center gap-2 rounded-xl border border-dourado-200/25 bg-dourado-200/5 px-3 py-3 font-serif text-xs text-dourado-200 disabled:opacity-40"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus
                  className="h-4 w-4"
                  strokeWidth={1.5}
                />
              )}

              Trocar
            </button>

            <button
              type="button"
              onClick={handleRemoveImage}
              disabled={
                disabled || uploading
              }
              className="flex items-center justify-center gap-2 rounded-xl border border-red-300/15 px-3 py-3 font-serif text-xs text-red-300/65 disabled:opacity-40"
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
          onClick={handleSelectImage}
          disabled={disabled || uploading}
          className="w-full rounded-2xl border border-dashed border-dourado-200/30 bg-bordo-300/30 px-5 py-7 disabled:opacity-40"
        >
          <div className="flex flex-col items-center text-center">
            {uploading ? (
              <Loader2 className="h-7 w-7 animate-spin text-dourado-200" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dourado-200/25 bg-dourado-200/5">
                <ImagePlus
                  className="h-5 w-5 text-dourado-200"
                  strokeWidth={1.4}
                />
              </div>
            )}

            <p className="mt-3 font-serif text-sm text-creme/80">
              {uploading
                ? 'Enviando imagem...'
                : 'Adicionar imagem'}
            </p>

            {!uploading && (
              <>
                <p className="mt-1 font-serif text-[11px] text-creme/35">
                  Toque para escolher uma imagem
                </p>

                <p className="mt-2 font-serif text-[9px] uppercase tracking-[0.12em] text-dourado-200/35">
                  JPG • PNG • WEBP • até 5 MB
                </p>
              </>
            )}
          </div>
        </button>
      )}

      {error && (
        <p className="text-center font-serif text-xs text-red-300/80">
          {error}
        </p>
      )}
    </div>
  );
}
