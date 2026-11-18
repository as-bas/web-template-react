export type UserRole = {
  slug: string;
  displayName: string;
};

export type UserProfile = {
  id: string;
  email: string;
  phone: string | null;
  fullName: string;
  roles: UserRole[];
};

// GET /v1/me: the profile plus when the account was created.
export type Me = UserProfile & { registeredAt: string };

export type Session = {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: UserProfile;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};
