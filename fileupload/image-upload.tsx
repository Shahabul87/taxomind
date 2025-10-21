'use client';

import { CldUploadWidget } from "next-cloudinary";
import { CloudinaryUploadWidgetResults } from '@cloudinary-util/types';
import Image from "next/image";
import { useCallback } from "react";
import { ImagePlus } from 'lucide-react'

declare global {
  var cloudinary: unknown
}

const uploadPreset = "dk2uffum";

interface ImageUploadProps {
  onChange: (value: string) => void;
  value: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onChange, value }) => {

  const handleUpload = useCallback((result: CloudinaryUploadWidgetResults) => {
    if (result.info && typeof result.info !== 'string') {
      onChange(result.info.secure_url);
    }
  }, [onChange]);

  return (
    <CldUploadWidget
      onSuccess={handleUpload}
      uploadPreset={uploadPreset}
      options={{
        maxFiles: 1
      }}
    >
      {({ open }) => {
        return (
          <div
            onClick={() => open?.()}
            className="
              relative
              cursor-pointer
              hover:opacity-70
              transition
              border-dashed 
              border-2 
              p-20 
              border-neutral-300
              flex
              flex-col
              justify-center
              items-center
              gap-4
              text-neutral-600
            "
          >
            <ImagePlus
              size={50}
            />
            <div className="font-semibold text-lg">
              Click to upload
            </div>
            {value && (
                        <div className="absolute inset-0 w-full h-full">
                          <Image
                            fill 
                            style={{ objectFit: 'cover' }} 
                            src={value} 
                            alt="House" 
                          />
                        </div>
            )}
          </div>
        ) 
    }}
    </CldUploadWidget>
  );
}

export default ImageUpload;