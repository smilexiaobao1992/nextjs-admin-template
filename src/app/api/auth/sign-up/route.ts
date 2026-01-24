import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { profile } from "@/lib/db/schema";
import { validateSignUpInput } from "@/lib/utils/validation";

// 注册时自动创建 profile
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 验证输入
    const validation = validateSignUpInput(body);
    if (!validation.valid) {
      return Response.json(
        {
          message: "Invalid input",
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    const { email, password, name } = validation.data!;

    // 先调用 better-auth 的注册
    const authRes = await auth.api.signUpEmail({
      body: { email, password, name },
    });

    if (!authRes) {
      throw new Error("注册失败");
    }

    // 创建成功后，创建 profile
    if (authRes.user) {
      await db.insert(profile).values({
        id: authRes.user.id,
        email: authRes.user.email,
        name: name || "",
      });
    }

    return new Response(JSON.stringify(authRes), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        message: error instanceof Error ? error.message : "注册失败",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}
