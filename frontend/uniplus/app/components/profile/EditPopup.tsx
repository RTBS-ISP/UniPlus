import React, { useState, useEffect } from "react";

interface EditPopupProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    firstName?: string;
    lastName?: string;
    aboutMe?: string;
    profilePic?: string;
  }) => void;
  initialData: {
    firstName?: string;
    lastName?: string;
    aboutMe?: string;
    profilePic?: string;
  };
}

export default function EditPopup({ open, onClose, onSave, initialData }: EditPopupProps) {
  const [firstName, setFirstName] = useState(initialData.firstName || "");
  const [lastName, setLastName] = useState(initialData.lastName || "");
  const [aboutMe, setAboutMe] = useState(initialData.aboutMe || "");
  const [profilePic, setProfilePic] = useState<string | null>(initialData.profilePic || null);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    setFirstName(initialData.firstName || "");
    setLastName(initialData.lastName || "");
    setAboutMe(initialData.aboutMe || "");
    setProfilePic(initialData.profilePic || null);
  }, [initialData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result as string);
      };
      reader.readAsDataURL(f);
    }
  };

  const handleSubmit = () => {
    onSave({
      firstName,
      lastName,
      aboutMe,
      profilePic: profilePic || undefined,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-gray-400/50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-10 w-[800px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl text-black font-bold mb-6">Edit Profile</h2>

        {/* Profile Edit Form */}
        <div className="mb-6 flex gap-8">
          {/* Left: Profile Picture Preview */}
          <div className="flex flex-col items-center">
            {profilePic ? (
                <img
                src={profilePic}
                alt="Preview"
                className="w-[256px] h-[297px] object-cover rounded-xl mb-2"
                />
            ) : (
                <div className="w-[256px] h-[297px] bg-gray-200 flex items-center justify-center rounded-xl mb-2">
                <span className="text-gray-500 text-sm">No image</span>
                </div>
            )}
            <label className="cursor-pointer bg-indigo-500 text-white px-4 py-1 rounded text-sm hover:bg-indigo-600">
                Upload Picture
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          {/* Right: Input fields */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="First Name"
              className="text-black bg-gray-100 rounded w-full px-3 py-2 mb-3"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />

            <input
              type="text"
              placeholder="Last Name"
              className="text-black bg-gray-100 rounded w-full px-3 py-2 mb-3"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />

            <textarea
              placeholder="Faculty (e.g. Software and Knowledge Engineering)"
              className="text-black bg-gray-100 rounded w-full px-3 py-2 mb-3 resize-none h-[80px]"
              value={aboutMe}
              onChange={(e) => setAboutMe(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-black bg-gray-200 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="inline-flex items-center justify-center px-6 py-2 text-base font-bold leading-6 text-white bg-indigo-500 border border-transparent rounded hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
