import { UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { createUserAction } from "@/features/users/actions";
import type { Role } from "@/lib/db/schema";

export function CreateUserForm({ roles }: { roles: Role[] }) {
  const defaultRole = roles.find((item) => item.isDefault)?.key ?? roles[0]?.key ?? "member";

  return (
    <section
      aria-labelledby="create-user-title"
      className="rounded-xl bg-card p-5 shadow-[0_1px_2px_rgba(62,47,35,0.06),0_10px_28px_rgba(62,47,35,0.09)] sm:p-6"
    >
      <div className="mb-5 flex items-center gap-3">
        <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/12 text-primary">
          <UserPlus aria-hidden="true" className="size-4" />
        </span>
        <div>
          <h2 id="create-user-title" className="font-semibold">创建用户</h2>
          <p className="text-sm text-muted-foreground">填写用户信息并选择角色，创建后即可登录系统。</p>
        </div>
      </div>

      <form
        action={createUserAction}
        className="space-y-5"
      >
        <div className="grid gap-4 lg:grid-cols-3">
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
        </div>

        <fieldset className="border-t border-border/70 pt-4">
          <legend className="pr-3 text-sm font-medium">角色（可同时选择多个）</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {roles.map((item) => (
              <label
                key={item.id}
                className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-border/80 px-3 py-2 text-sm transition-colors hover:bg-accent/45 has-checked:border-primary has-checked:bg-primary/8 has-checked:text-primary"
              >
                <input
                  type="checkbox"
                  name="roles"
                  value={item.key}
                  defaultChecked={item.key === defaultRole}
                  className="size-4 shrink-0"
                />
                <span>{item.name}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex justify-end">
          <SubmitButton pendingLabel="创建中…">创建用户</SubmitButton>
        </div>
      </form>
    </section>
  );
}
