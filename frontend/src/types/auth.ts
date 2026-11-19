
export type AuthUser = {
  id: number;
  full_name: string;
  email: string;
  role: string;
};

export type AuthMode = "login" | "register";
