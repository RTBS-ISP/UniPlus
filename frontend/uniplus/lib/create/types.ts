export type FormData = {
  eventTitle: string;
  eventDescription: string;
  category: string;
  maxAttendee: string;
  tags: string[];
  eventEmail: string;
  eventPhoneNumber: string;
  eventWebsiteUrl: string;
  termsAndConditions: string;
  registrationStartDate: string;
  registrationEndDate: string;
  eventStartDate: string;
  eventEndDate: string;
  imageFile: File | null;
  imagePreview: string;
};

export type Summary = {
  when: string;
  where: string;
  capacity: string;
  tags: string;
  modeLabel: string;
};
