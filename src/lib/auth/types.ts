// 订单状态标签
export type OrderStatus =
  | "draft"                // 草稿
  | "confirmed"            // 已确认
  | "in_production"        // 生产中
  | "ready_for_delivery"   // 待交付
  | "delivered"            // 已交付
  | "cancelled";           // 已取消

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: "草稿",
  confirmed: "已确认",
  in_production: "生产中",
  ready_for_delivery: "待交付",
  delivered: "已交付",
  cancelled: "已取消",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  draft: "bg-gray-100 text-gray-800 border-gray-300",
  confirmed: "bg-indigo-100 text-indigo-800 border-indigo-300",
  in_production: "bg-blue-100 text-blue-800 border-blue-300",
  ready_for_delivery: "bg-green-100 text-green-800 border-green-300",
  delivered: "bg-purple-100 text-purple-800 border-purple-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
};

// 订单状态流转规则
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: ["confirmed", "cancelled"],
  confirmed: ["in_production", "cancelled"],
  in_production: ["ready_for_delivery", "cancelled"],
  ready_for_delivery: ["delivered"],
  delivered: [],
  cancelled: [],
};
