export interface ApiUser {
  id: string;
  username: string;
  fullName: string;
  role: 'resident' | 'secretary' | 'treasurer' | 'captain' | 'other';
  residentRef?: string | null;
  isActive?: boolean;
  mustChangePassword?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: { field: string; message: string }[];
  meta?: { page: number; limit: number; total: number; totalPages: number };
}

export async function api<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  let body: ApiResponse<T>;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    return { success: false, message: `Request failed (${res.status})` };
  }

  if (!res.ok && body.success !== false) {
    body.success = false;
  }
  return body;
}
