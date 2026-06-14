import Link from "next/link";
import { Button } from "@/components/ui/button";
import { prisma } from "@/db/client";
import { notFound } from "next/navigation";
import { LocationForm } from "@/components/location/location-form";

export const dynamic = "force-dynamic";

export default async function NewLocationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();

  const locations = await prisma.location.findMany({
    where: { campaignId: id },
    orderBy: { name: "asc" },
    select: { id: true, name: true, kind: true },
  });

  return (
    <div>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/campaign/${id}/locations`}>&larr; Locations</Link>
        </Button>
      </div>
      <h2 className="mb-4 font-display text-xl">New Location</h2>
      <LocationForm campaignId={id} parentOptions={locations} />
    </div>
  );
}
