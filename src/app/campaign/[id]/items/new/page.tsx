import Link from "next/link";
import { Button } from "@/components/ui/button";
import { prisma } from "@/db/client";
import { notFound } from "next/navigation";
import { ItemForm } from "@/components/item/item-form";

export const dynamic = "force-dynamic";

export default async function NewItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();

  return (
    <div>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/campaign/${id}/items`}>&larr; Items</Link>
        </Button>
      </div>
      <h2 className="mb-4 font-display text-xl">New Item</h2>
      <ItemForm campaignId={id} />
    </div>
  );
}
