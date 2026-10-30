export interface AuthUser {
  id: number;
  username: string;
  display_name: string;
  is_admin: boolean;
  is_active: boolean;
}

export async function authError(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  if (body && typeof body === "object" && "detail" in body && typeof body.detail === "string") {
    if (body.detail === "Invalid username or password") return "Tên tài khoản hoặc mật khẩu không đúng.";
    if (body.detail === "Try again later") return "Tài khoản tạm khóa do đăng nhập sai nhiều lần. Thử lại sau 15 phút.";
    if (body.detail === "Username already exists") return "Tên tài khoản đã tồn tại.";
    if (body.detail === "Current password is incorrect") return "Mật khẩu hiện tại không đúng.";
    return body.detail;
  }
  return `Yêu cầu thất bại (${response.status})`;
}
