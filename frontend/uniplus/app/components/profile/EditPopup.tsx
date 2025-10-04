import React, { useState, useEffect } from "react";

interface AboutMe {
  faculty?: string;
  year?: string;
  organizerName?: string;
}

interface EditPopupProps {
  open: boolean;
  onClose: () => void;
  role: string;
  onSave: (data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    aboutMe?: AboutMe;
    profilePic?: string;
  }) => void;
  initialData: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    aboutMe?: AboutMe | null;
    profilePic?: string;
  };
}

export default function EditPopup({
  open,
  onClose,
  role,
  onSave,
  initialData,
}: EditPopupProps) {
  const [firstName, setFirstName] = useState(initialData.firstName ?? "");
  const [lastName, setLastName] = useState(initialData.lastName ?? "");
  const [phone, setPhone] = useState(initialData.phone ?? "");
  const [aboutMe, setAboutMe] = useState<AboutMe>(
    initialData.aboutMe || { faculty: "", year: "", organizerName: "" }
  );
  const [profilePic, setProfilePic] = useState<string | null>(
    initialData.profilePic || null
  );
  const [file, setFile] = useState<File | null>(null);

  // ✅ Reset on popup open
  useEffect(() => {
    if (open) {
      setFirstName(initialData.firstName ?? "");
      setLastName(initialData.lastName ?? "");
      setPhone(initialData.phone ?? "");
      setAboutMe(
        initialData.aboutMe || { faculty: "", year: "", organizerName: "" }
      );
      setProfilePic(initialData.profilePic || null);
    }
  }, [open, initialData]);

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

  // ✅ Validation rules
  const isPhoneValid =
    phone.trim() === "" || /^\d{10}$/.test(phone.trim()); // allow empty or exactly 10 digits
  const isFirstNameValid =
    firstName.trim() === "" || /^[A-Za-z\s]+$/.test(firstName.trim());
  const isLastNameValid =
    lastName.trim() === "" || /^[A-Za-z\s]+$/.test(lastName.trim());

  const isFormValid = isPhoneValid && isFirstNameValid && isLastNameValid;

  const handleSubmit = () => {
    if (!isFormValid) return; // safety net

    const dataToSave: any = {
      firstName: firstName.trim() !== "" ? firstName : initialData.firstName,
      lastName: lastName.trim() !== "" ? lastName : initialData.lastName,
      phone: phone.trim() !== "" ? phone : initialData.phone,
      profilePic: profilePic || initialData.profilePic,
    };

    if (role === "student") {
      dataToSave.aboutMe = {
        faculty:
          aboutMe.faculty?.trim() !== ""
            ? aboutMe.faculty
            : initialData.aboutMe?.faculty,
        year:
          aboutMe.year?.trim() !== ""
            ? aboutMe.year
            : initialData.aboutMe?.year,
      };
    }

    if (role === "organizer") {
      dataToSave.aboutMe = {
        organizerName:
          aboutMe.organizerName?.trim() !== ""
            ? aboutMe.organizerName
            : initialData.aboutMe?.organizerName,
      };
    }

    onSave(dataToSave);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-gray-400/50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-10 w-[800px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl text-black font-bold mb-6">Edit Profile</h2>

        <div className="mb-6 flex gap-8">
          {/* Left: Profile Picture */}
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
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {/* Right: Inputs */}
          <div className="flex-1">
            {/* First Name */}
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              className={`text-black bg-gray-100 rounded-lg w-full px-3 py-2 mb-1 ${
                !isFirstNameValid ? "border border-red-500" : ""
              }`}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            {!isFirstNameValid && (
              <p className="text-red-500 text-sm mb-2">
                First name should not contain numbers or special characters.
              </p>
            )}

            {/* Last Name */}
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              className={`text-black bg-gray-100 rounded-lg w-full px-3 py-2 mb-1 ${
                !isLastNameValid ? "border border-red-500" : ""
              }`}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            {!isLastNameValid && (
              <p className="text-red-500 text-sm mb-2">
                Last name should not contain numbers or special characters.
              </p>
            )}

            {/* Phone */}
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              className={`text-black bg-gray-100 rounded-lg w-full px-3 py-2 mb-1 ${
                !isPhoneValid ? "border border-red-500" : ""
              }`}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {!isPhoneValid && (
              <p className="text-red-500 text-sm mb-2">
                Phone number must be exactly 10 digits and not contain special characters.
              </p>
            )}

            {role === "organizer" && (
              <>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Organizer Name
                </label>
                <input
                  type="text"
                  className="text-black bg-gray-100 rounded-lg w-full px-3 py-2 mb-4"
                  value={aboutMe.organizerName || ""}
                  onChange={(e) =>
                    setAboutMe((prev) => ({
                      ...prev,
                      organizerName: e.target.value,
                    }))
                  }
                />
              </>
            )}

            {role === "student" && (
              <>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Faculty
                </label>
                <input
                  type="text"
                  className="text-black bg-gray-100 rounded-lg w-full px-3 py-2 mb-4"
                  value={aboutMe.faculty || ""}
                  onChange={(e) =>
                    setAboutMe((prev) => ({ ...prev, faculty: e.target.value }))
                  }
                />

                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Year
                </label>
                <input
                  type="text"
                  className="text-black bg-gray-100 rounded-lg w-full px-3 py-2 mb-4"
                  value={aboutMe.year || ""}
                  onChange={(e) =>
                    setAboutMe((prev) => ({ ...prev, year: e.target.value }))
                  }
                />
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-black bg-gray-200 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isFormValid}
            className={`inline-flex items-center justify-center px-6 py-2 text-base font-bold leading-6 text-white 
              ${
                isFormValid
                  ? "bg-indigo-500 hover:bg-indigo-400 focus:ring-indigo-400"
                  : "bg-gray-400 cursor-not-allowed"
              } 
              border border-transparent rounded focus:outline-none focus:ring-2 focus:ring-offset-2`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
