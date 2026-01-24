// 数据库类型
export type UserRole = "admin" | "user";

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_no: string;
  batch_no: string;
  customer_name: string;
  product_name: string;
  product_spec: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  delivery_date: string;
  status: OrderStatus;
  notes: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type OrderStatus =
  | "pending"
  | "in_production"
  | "paused"
  | "completed"
  | "delivered"
  | "cancelled";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "待生产",
  in_production: "生产中",
  paused: "已暂停",
  completed: "已完成",
  delivered: "已交付",
  cancelled: "已取消",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-gray-100 text-gray-800",
  in_production: "bg-blue-100 text-blue-800",
  paused: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  delivered: "bg-purple-100 text-purple-800",
  cancelled: "bg-red-100 text-red-800",
};

// 订单状态流转规则
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["in_production", "cancelled"],
  in_production: ["paused", "completed", "cancelled"],
  paused: ["in_production", "cancelled"],
  completed: ["delivered"],
  delivered: [],
  cancelled: [],
};
