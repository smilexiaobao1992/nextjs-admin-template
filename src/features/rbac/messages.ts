export const rbacNoticeMessages: Record<string, string> = {
  created: "已创建。",
  updated: "已保存。",
  deleted: "已删除。",
  invalid_input: "请检查表单字段是否填写正确。",
  not_found: "记录不存在，请刷新后重试。",
  duplicate: "该 key 已被使用，请换一个。",
  system_locked: "系统内置项不能删除；只能修改名称、图标、排序和显示状态。",
  role_scope_forbidden: "只能管理权限范围不超过你自己的角色。",
  in_use: "仍被使用（存在子节点、已授权给角色或已分配给用户），请先解除后再删除。",
  last_default: "必须保留一个默认角色。",
  failed: "操作未完成，请稍后重试。",
};
