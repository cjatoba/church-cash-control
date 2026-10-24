import { PageShell } from "@/app/_components/page-shell";
import { SkeletonCard, SkeletonList, SkeletonPageHeader } from "@/app/_components/page-skeleton";

export default function DonorDetailLoading() {
  return (
    <PageShell>
      <SkeletonPageHeader />
      <SkeletonCard lines={2} />
      <SkeletonList rows={2} />
    </PageShell>
  );
}
