import { createInterface } from "node:readline/promises";
import { dbClient } from "../src/lib/db";
import { createCredentialUser, UserManagementError } from "../src/lib/auth/user-management";
import { consumeHiddenInput } from "./hidden-input";
import { SYSTEM_ADMIN_ROLE_KEY } from "../src/lib/rbac/constants";

async function readHidden(prompt: string): Promise<string> {
  const input = process.stdin;
  const output = process.stdout;

  if (!input.isTTY || !input.setRawMode) {
    throw new Error("请在交互式终端中运行 npm run admin:create");
  }

  output.write(prompt);
  input.setRawMode(true);
  input.resume();

  return new Promise((resolve, reject) => {
    let value = "";

    function finish() {
      input.setRawMode(false);
      input.pause();
      input.off("data", onData);
      output.write("\n");
    }

    function onData(buffer: Buffer) {
      const result = consumeHiddenInput(value, buffer.toString("utf8"));
      value = result.value;

      if (result.action === "cancel") {
        finish();
        reject(new Error("已取消"));
        return;
      }

      if (result.action === "submit") {
        finish();
        resolve(value);
      }
    }

    input.on("data", onData);
  });
}

async function main() {
  const readline = createInterface({ input: process.stdin, output: process.stdout });
  const name = await readline.question("管理员姓名: ");
  const email = await readline.question("管理员邮箱: ");
  readline.close();

  const password = await readHidden("管理员密码: ");
  const confirmation = await readHidden("再次输入密码: ");
  if (password !== confirmation) {
    throw new Error("两次输入的密码不一致");
  }

  await createCredentialUser(
    { name, email, password, role: SYSTEM_ADMIN_ROLE_KEY },
    SYSTEM_ADMIN_ROLE_KEY,
  );
  process.stdout.write(`管理员 ${email.trim().toLowerCase()} 已创建。\n`);
}

main()
  .catch((error) => {
    const message = error instanceof UserManagementError && error.code === "email_taken"
      ? "该邮箱已经存在"
      : error instanceof UserManagementError && error.code === "invalid_input"
        ? "姓名或邮箱无效，密码需至少 12 位且同时包含字母和数字"
        : error instanceof Error
          ? error.message
          : "管理员创建失败";
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await dbClient.end();
  });
