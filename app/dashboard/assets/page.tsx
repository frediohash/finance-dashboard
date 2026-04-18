import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { assets } from "@/db/schema/assets";
import { eq } from "drizzle-orm";
import { AssetsView } from "@/components/finance/assets-view";

export default async function AssetsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session!.user.id;

  const allAssets = await db.select().from(assets).where(eq(assets.userId, userId));

  const serialized = allAssets.map((a) => ({
    ...a,
    purchaseValue: a.purchaseValue.toString(),
    currentValue: a.currentValue.toString(),
    depreciationRate: a.depreciationRate?.toString() ?? null,
    purchaseDate: a.purchaseDate.toISOString(),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  return <AssetsView initialAssets={serialized} />;
}
