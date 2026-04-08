export const ALLOWED_PROFILE_IMAGES = [
  "/avatars/avatar-1.svg",
  "/avatars/avatar-2.svg",
  "/avatars/avatar-3.svg",
  "/avatars/avatar-4.svg",
  "/avatars/avatar-5.svg",
] as const;

export const DEFAULT_PROFILE_IMAGE = ALLOWED_PROFILE_IMAGES[0];

export type ProfileImage = (typeof ALLOWED_PROFILE_IMAGES)[number];

export const isAllowedProfileImage = (value: string): value is ProfileImage =>
  ALLOWED_PROFILE_IMAGES.includes(value as ProfileImage);
