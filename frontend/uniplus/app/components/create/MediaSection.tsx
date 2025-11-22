import { Trash2 } from "lucide-react";
import { sectionCard } from "@/lib/create/styles";

type Props = {
  imagePreview: string;
  onFileChange: (file: File | null) => void;
  onRemoveImage: () => void;
};

export function MediaSection({
  imagePreview,
  onFileChange,
  onRemoveImage,
}: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onFileChange(file);
  };

  return (
    <section className={sectionCard}>
      <h2 className="text-lg font-semibold text-gray-900">Media</h2>
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between">
          <label
            htmlFor="imageUpload"
            className="block text-sm font-medium text-gray-700"
          >
            Event Image
          </label>

          {imagePreview && (
            <button
              type="button"
              onClick={onRemoveImage}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </button>
          )}
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-indigo-400 transition">
          <input
            id="imageUpload"
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />
          <label htmlFor="imageUpload" className="cursor-pointer block">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="mx-auto h-40 w-full object-cover rounded-lg"
                onError={(e) => {
                  console.error("Image failed to load:", e);
                  (e.target as HTMLImageElement).src = "/placeholder.png";
                }}
              />
            ) : (
              <div className="py-8 text-gray-500">
                Click to upload an image (JPG/PNG)
              </div>
            )}
          </label>
        </div>
      </div>
    </section>
  );
}
