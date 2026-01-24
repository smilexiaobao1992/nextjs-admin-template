import { db } from "@/lib/db/index";
import { customer } from "@/lib/db/schema";
import { eq, sql, like } from "drizzle-orm";

/**
 * 生成下一个客户编号
 * 格式: CUS + 年份 + 3位序号 (如: CUS2025001)
 */
export async function getNextCustomerNo(): Promise<string> {
  const currentYear = new Date().getFullYear().toString();

  // 查询当前年份的最大序号
  const result = await db
    .select({
      customerNo: customer.customerNo,
    })
    .from(customer)
    .where(like(customer.customerNo, sql`${`CUS${currentYear}%`}`))
    .orderBy(sql`${customer.customerNo} DESC`)
    .limit(1);

  let nextSequence = 1;

  if (result.length > 0 && result[0]?.customerNo) {
    const lastCustomerNo = result[0].customerNo;
    const lastSequence = parseInt(lastCustomerNo.slice(-3));
    if (!isNaN(lastSequence)) {
      nextSequence = lastSequence + 1;
    }
  }

  // 格式化为3位数字，不足前面补0
  const sequenceStr = nextSequence.toString().padStart(3, "0");

  return `CUS${currentYear}${sequenceStr}`;
}

/**
 * 生成下一个订单编号（保留以备将来使用）
 * 格式: SO + 日期(YYYYMMDD) + 4位随机数
 */
export function getNextOrderNo(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `SO${dateStr}${random}`;
}
