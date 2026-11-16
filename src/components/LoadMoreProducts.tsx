import { useStore, loadMoreProducts } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

export function LoadMoreProducts() {
  const { hasMoreProducts, loading, loadingMoreProducts } = useStore();

  if (loading || !hasMoreProducts) return null;

  async function handleLoadMore() {
    try {
      await loadMoreProducts();
    } catch {
      toast.error("Could not load more products. Please try again.");
    }
  }

  return (
    <div className="mt-8 flex justify-center">
      <Button type="button" variant="outline" onClick={handleLoadMore} disabled={loadingMoreProducts}>
        {loadingMoreProducts && <LoaderCircle className="animate-spin" aria-hidden="true" />}
        {loadingMoreProducts ? "Loading products…" : "Load more products"}
      </Button>
    </div>
  );
}