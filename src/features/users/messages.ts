export const userNoticeMessages: Record<string, string> = {
  created: "用户已创建。",
  role_updated: "角色已更新。",
  invalid_input: "请检查姓名、邮箱和密码。密码至少 12 位，并同时包含字母和数字。",
  email_taken: "该邮箱已经存在。",
  last_admin: "必须至少保留一个管理员。",
  not_found: "用户不存在，请刷新页面。",
  invalid_role: "角色不存在，请刷新后重试。",
  system_role_forbidden: "只有系统管理员可以授予或移除系统角色。",
  role_scope_forbidden: "只能管理权限范围不超过你自己的角色。",
  failed: "操作未完成，请稍后重试。",
};
