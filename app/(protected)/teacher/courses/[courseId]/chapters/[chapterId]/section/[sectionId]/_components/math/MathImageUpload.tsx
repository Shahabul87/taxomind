'use client';

import { CldUploadWidget } from 'next-cloudinary';
import { CloudinaryUploadWidgetResults } from '@cloudinary-util/types';
import Image from 'next/image';
import { useCallback } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

declare global {
  // eslint-disable-next-line no-var
  var cloudinary: unknown;
}

const uploadPreset = 'dk2uffum';

interface MathImageUploadProps {
  onChange: (value: string) => void;
  value: string;
  disabled?: boolean;
}

export const MathImageUpload = ({ onChange, value, disabled }: MathImageUploadProps) => {
  const handleUpload = useCallback((result: CloudinaryUploadWidgetResults) => {
    if (result?.info && typeof result.info !== 'string') {
      onChange(result.info.secure_url);
    }
  }, [onChange]);

  const handleRemove = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <CldUploadWidget
      onSuccess={handleUpload}
      uploadPreset={uploadPreset}
      options={{
        maxFiles: 1,
        resourceType: 'image',
      }}
    >
      {({ open }) => {
        return (
          <div className="space-y-4">
            <div
              onClick={() => !disabled && open?.()}
              className={`
                relative
                ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:opacity-70'}
                transition
                border-dashed
                border-2
                p-12
                border-neutral-300
                rounded-lg
                flex
                flex-col
                justify-center
                items-center
                gap-4
                text-neutral-600
                ${value ? 'bg-muted/30' : 'bg-background'}
              `}
            >
              {!value ? (
                <>
                  <ImagePlus size={50} className="text-muted-foreground" />
                  <div className="font-semibold text-lg">
                    Click to upload image
                  </div>
                  <p className="text-sm text-muted-foreground">
                    or drag and drop here
                  </p>
                </>
              ) : (
                <div className="relative w-full h-64">
                  <Image
                    fill
                    style={{ objectFit: 'contain' }}
                    src={value}
                    alt="Math equation image"
                    className="rounded"
                  />
                  {!disabled && (
                    <Button
                      onClick={handleRemove}
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      }}
    </CldUploadWidget>
  );
};
