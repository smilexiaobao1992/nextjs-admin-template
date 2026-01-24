/**
 * 安全工具函数
 * 用于敏感数据脱敏和处理
 */

/**
 * 脱敏敏感数据
 * @param data 原始数据
 * @param visibleChars 前后保留的字符数
 * @param maskChar 掩码字符
 * @returns 脱敏后的数据
 */
export function maskSensitiveData(
  data: string,
  visibleChars: number = 4,
  maskChar: string = "*"
): string {
  if (!data || typeof data !== "string") {
    return "";
  }

  // 如果数据太短，全部掩码
  if (data.length <= visibleChars * 2) {
    return maskChar.repeat(Math.max(data.length, 8));
  }

  const start = data.slice(0, visibleChars);
  const end = data.slice(-visibleChars);
  const middleLength = Math.min(data.length - visibleChars * 2, 20);
  const middle = maskChar.repeat(middleLength);

  return `${start}${middle}${end}`;
}

/**
 * 验证并限制 API 权限范围
 * @param requestedScopes 请求的权限范围
 * @param maxScope 最大允许的权限级别
 * @returns 限制后的权限范围
 */
export function limitApiScopes(
  requestedScopes: string[] | undefined,
  maxScope: "read" | "write" | "admin" = "read"
): string[] {
  if (!requestedScopes || requestedScopes.length === 0) {
    return [];
  }

  // 定义危险权限模式（不应允许）
  const dangerousPatterns = ["*", "admin", "delete", "write"];

  const allowed: string[] = [];
  for (const scope of requestedScopes) {
    const lowerScope = scope.toLowerCase();

    // 根据最大权限级别过滤
    if (maxScope === "read") {
      // 只允许读取权限
      if (lowerScope.includes("read") || lowerScope.includes("view")) {
        allowed.push(scope);
      }
    } else if (maxScope === "write") {
      // 不允许删除和管理权限
      if (!lowerScope.includes("delete") && !lowerScope.includes("admin")) {
        allowed.push(scope);
      }
    } else {
      // admin 级别允许所有权限
      allowed.push(scope);
    }
  }

  return allowed;
}

/**
 * 检查 IP 地址是否在白名单中
 * @param clientIp 客户端 IP
 * @param whitelist IP 白名单数组
 * @returns 是否允许
 */
export function isIpAllowed(clientIp: string, whitelist: string[] | null | undefined): boolean {
  if (!whitelist || whitelist.length === 0) {
    return true; // 没有白名单限制
  }

  return whitelist.some(allowedIp => {
    // 支持 CIDR 格式和简单 IP 匹配
    if (allowedIp.includes("/")) {
      // CIDR 格式 (简化处理，实际应使用专门的库)
      const [base, _] = allowedIp.split("/");
      return clientIp.startsWith(base);
    }
    return clientIp === allowedIp || clientIp === allowedIp.replace(/\.\d+$/, ".*");
  });
}

/**
 * 生成安全的随机字符串
 * @param length 字符串长度
 * @returns 随机字符串
 */
export function generateSecureToken(length: number = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);

  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }

  return result;
}

/**
 * 生成 API Key 前缀
 * @returns 前缀字符串
 */
export function generateKeyPrefix(): string {
  const prefix = "sk";
  const random = generateSecureToken(8);
  return `${prefix}_${random}`;
}

/**
 * 验证 API Key 格式
 * @param key API Key
 * @returns 是否有效
 */
export function isValidApiKeyFormat(key: string): boolean {
  // 基本格式验证：至少 20 个字符，包含字母数字
  if (!key || key.length < 20) {
    return false;
  }

  // 检查是否包含危险字符
  const dangerousChars = /[\s\r\n]/;
  if (dangerousChars.test(key)) {
    return false;
  }

  return true;
}
