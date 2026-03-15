"use client"
import { useState } from "react";
import { FaSave } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import MoodSelector from "./mood_selector";
import UploadButton from "./upload_button";

interface JournalFormProps {
  createJournal: (formData: FormData) => Promise<void>;
}

export default function JournalForm({ createJournal }: JournalFormProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleFileSelect = (file: File) => {
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (formData: FormData) => {
    if (imageFile) formData.set("image", imageFile);
    await createJournal(formData);
  };

  return (
    <form action={handleSubmit} className="w-full flex flex-col gap-24 items-center mb-12">

      {/* Header */}
      <header className="w-full bg-[#FBF5D1] p-12">
        <h1 className="text-center text-[#163F55] text-6xl font-cherry">
          How are you feeling today?
        </h1>
        <MoodSelector />
      </header>

      <div className="flex flex-col items-center bg-white rounded-2xl w-[70%] gap-8 p-12">
        <input
          name="entry_title"
          placeholder="Title"
          className="font-cherry text-5xl text-center resize-y w-full"
          required
        />
        <textarea
          name="entry_text"
          placeholder="Write your thoughts..."
          className="font-delius min-h-200 resize-y p-4 w-full border rounded-3xl"
          required
        />

        {/* Image preview */}
        {previewUrl && (
          <div className="relative w-full">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full max-h-96 object-cover rounded-2xl"
            />
            <button
              type="button"
              onClick={() => { setPreviewUrl(null); setImageFile(null); }}
              className="absolute top-2 right-2 bg-white text-[#163F55] rounded-full p-1 hover:bg-[#F0B6CF] transition-colors"
            >
              <IoClose size={20} />
            </button>
          </div>
        )}

        {/* Save button */}
        <button
          type="submit"
          className="
            fixed right-4 bottom-[120px]
            bg-[#FBF5D1] text-[#163F55]
            border-none p-6 rounded-xl
            cursor-pointer text-xl
            hover:bg-[#F0B6CF] transition-colors
          "
        >
          <FaSave />
        </button>
      </div>

      <UploadButton onFileSelect={handleFileSelect} />

    </form>
  );
}