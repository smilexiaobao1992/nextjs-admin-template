import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { validateSignInInput } from "@/lib/utils/validation";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 验证输入
    const validation = validateSignInInput(body);
    if (!validation.valid) {
      return Response.json(
        {
          success: false,
          message: "Invalid input",
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data!;

    // 调用 Better Auth 登录
    await auth.api.signInEmail({
      body: { email, password },
      headers: await headers(),
    });

    // 不返回任何敏感数据，只返回成功状态
    // Session 通过 HTTP-only cookies 自动设置
    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "登录失败",
      },
      { status: 401 }
    );
  }
}
