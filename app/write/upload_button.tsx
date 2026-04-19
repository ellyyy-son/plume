"use client"
import { useRef } from "react";
import { IoAdd } from "react-icons/io5";

interface UploadButtonProps {
  onFileSelect: (file: File) => void;
}

export default function UploadButton({ onFileSelect }: UploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        name="image"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="
          fixed right-4 bottom-5
          bg-[#ADD3EA] text-[#163F55]
          border-none p-6 rounded-xl
          cursor-pointer text-xl
          hover:bg-[#163f5575] transition-colors
        "
      >
        <IoAdd />
      </button>
    </>
  );
}