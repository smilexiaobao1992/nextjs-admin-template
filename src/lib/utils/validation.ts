/**
 * 输入验证工具
 * 提供常用的数据验证函数
 */

/**
 * 验证邮箱格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证密码强度
 * 要求：至少 8 个字符
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

/**
 * 验证字符串长度
 */
export function isValidLength(
  value: string,
  min: number,
  max?: number
): boolean {
  if (max !== undefined) {
    return value.length >= min && value.length <= max;
  }
  return value.length >= min;
}

/**
 * 验证登录请求体
 */
export interface SignInInput {
  email: string;
  password: string;
}

export function validateSignInInput(data: unknown): {
  valid: boolean;
  errors?: Record<string, string>;
  data?: SignInInput;
} {
  if (!data || typeof data !== "object") {
    return { valid: false, errors: { general: "Invalid request body" } };
  }

  const { email, password } = data as any;
  const errors: Record<string, string> = {};

  if (!email || typeof email !== "string") {
    errors.email = "Email is required";
  } else if (!isValidEmail(email)) {
    errors.email = "Invalid email format";
  }

  if (!password || typeof password !== "string") {
    errors.password = "Password is required";
  } else if (!isValidPassword(password)) {
    errors.password = "Password must be at least 8 characters";
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: { email, password } };
}

/**
 * 验证注册请求体
 */
export interface SignUpInput {
  email: string;
  password: string;
  name?: string;
}

export function validateSignUpInput(data: unknown): {
  valid: boolean;
  errors?: Record<string, string>;
  data?: SignUpInput;
} {
  if (!data || typeof data !== "object") {
    return { valid: false, errors: { general: "Invalid request body" } };
  }

  const { email, password, name } = data as any;
  const errors: Record<string, string> = {};

  if (!email || typeof email !== "string") {
    errors.email = "Email is required";
  } else if (!isValidEmail(email)) {
    errors.email = "Invalid email format";
  }

  if (!password || typeof password !== "string") {
    errors.password = "Password is required";
  } else if (!isValidPassword(password)) {
    errors.password = "Password must be at least 8 characters";
  }

  if (name !== undefined && typeof name !== "string") {
    errors.name = "Name must be a string";
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: { email, password, name } };
}
