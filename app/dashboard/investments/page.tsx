import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { investments } from "@/db/schema/investments";
import { eq } from "drizzle-orm";
import { InvestmentsView } from "@/components/finance/investments-view";

export default async function InvestmentsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;

  const allInvestments = await db.select().from(investments).where(eq(investments.userId, userId));

  const serialized = allInvestments.map((i) => ({
    ...i,
    quantity: i.quantity?.toString() ?? null,
    purchasePrice: i.purchasePrice.toString(),
    currentPrice: i.currentPrice.toString(),
    purchaseDate: i.purchaseDate.toISOString(),
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  }));

  return <InvestmentsView initialInvestments={serialized} />;
}
