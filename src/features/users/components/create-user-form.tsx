import { UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { createUserAction } from "@/features/users/actions";
import type { Role } from "@/lib/db/schema";

export function CreateUserForm({ roles }: { roles: Role[] }) {
  const defaultRole = roles.find((item) => item.isDefault)?.key ?? roles[0]?.key ?? "member";

  return (
    <section
      aria-labelledby="create-user-title"
      className="rounded-xl bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.10)] sm:p-6"
    >
      <div className="mb-5 flex items-center gap-3">
        <span className="inline-flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
          <UserPlus aria-hidden="true" className="size-4" />
        </span>
        <div>
          <h2 id="create-user-title" className="font-semibold">创建用户</h2>
          <p className="text-sm text-muted-foreground">公开注册默认关闭，账号由管理员创建并分配角色。</p>
        </div>
      </div>

      <form
        action={createUserAction}
        className="grid gap-4 lg:grid-cols-[1fr_1.2fr_1.2fr_auto_auto] lg:items-end"
      >
        <div className="space-y-2">
          <Label htmlFor="name">姓名</Label>
          <Input id="name" name="name" autoComplete="name" maxLength={100} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-email">邮箱</Label>
          <Input id="new-email" name="email" type="email" autoComplete="off" spellCheck={false} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-password">初始密码</Label>
          <Input
            id="new-password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            pattern="(?=.*[A-Za-z])(?=.*\d).{12,}"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-role">角色</Label>
          <Select id="new-role" name="role" defaultValue={defaultRole}>
            {roles.map((item) => (
              <option key={item.id} value={item.key}>
                {item.name}
              </option>
            ))}
          </Select>
        </div>
        <SubmitButton pendingLabel="创建中…">创建用户</SubmitButton>
      </form>
    </section>
  );
}
