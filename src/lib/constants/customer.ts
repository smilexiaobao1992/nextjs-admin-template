/**
 * 客户相关常量定义
 * 统一管理客户模块的标签映射和枚举值
 */

// 客户等级标签映射
export const LEVEL_LABELS: Record<string, { label: string; color: string }> = {
  A: { label: "A级", color: "bg-red-100 text-red-700 border-red-300" },
  B: { label: "B级", color: "bg-orange-100 text-orange-700 border-orange-300" },
  C: { label: "C级", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  D: { label: "D级", color: "bg-gray-100 text-gray-700 border-gray-300" },
};

// 客户等级选项
export const CUSTOMER_LEVELS = [
  { value: "A", label: "A级（重要客户）" },
  { value: "B", label: "B级（优质客户）" },
  { value: "C", label: "C级（普通客户）" },
  { value: "D", label: "D级（潜在客户）" },
] as const;

// 客户来源标签映射
export const SOURCE_LABELS: Record<string, string> = {
  online: "线上推广",
  referral: "老客户介绍",
  outreach: "主动开发",
  other: "其他",
};

// 客户来源选项
export const CUSTOMER_SOURCES = [
  { value: "online", label: "线上推广" },
  { value: "referral", label: "老客户介绍" },
  { value: "outreach", label: "主动开发" },
  { value: "other", label: "其他" },
] as const;

// 客户状态标签映射
export const STATUS_LABELS: Record<string, string> = {
  active: "启用",
  inactive: "禁用",
};

// 客户状态选项
export const CUSTOMER_STATUS = [
  { value: "active", label: "启用" },
  { value: "inactive", label: "禁用" },
] as const;

// 联系类型标签映射
export const CONTACT_TYPE_LABELS: Record<string, string> = {
  phone: "电话",
  wechat: "微信",
  email: "邮件",
  visit: "拜访",
  other: "其他",
};

// 联系类型选项
export const CONTACT_TYPES = [
  { value: "phone", label: "电话" },
  { value: "wechat", label: "微信" },
  { value: "email", label: "邮件" },
  { value: "visit", label: "拜访" },
  { value: "other", label: "其他" },
] as const;

// 订单状态标签映射（用于详情页）
export const ORDER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "草稿", color: "bg-gray-100 text-gray-700" },
  confirmed: { label: "已确认", color: "bg-blue-100 text-blue-700" },
  in_production: { label: "生产中", color: "bg-yellow-100 text-yellow-700" },
  ready_for_delivery: { label: "待交付", color: "bg-purple-100 text-purple-700" },
  delivered: { label: "已交付", color: "bg-green-100 text-green-700" },
  cancelled: { label: "已取消", color: "bg-red-100 text-red-700" },
};

// 类型导出
export type CustomerLevel = typeof CUSTOMER_LEVELS[number]["value"];
export type CustomerSource = typeof CUSTOMER_SOURCES[number]["value"];
export type CustomerStatus = typeof CUSTOMER_STATUS[number]["value"];
export type ContactType = typeof CONTACT_TYPES[number]["value"];
