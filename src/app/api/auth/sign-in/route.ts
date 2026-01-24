import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: Request) {
  const body = await req.json();
  const { email, password } = body;

  try {
    // 调用 Better Auth 登录
    await auth.api.signInEmail({
      body: { email, password },
      headers: await headers(),
    });

    // 不返回任何敏感数据，只返回成功状态
    // Session 通过 HTTP-only cookies 自动设置
    return Response.json({ success: true, user: null });
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
