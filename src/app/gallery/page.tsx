"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { formatPrice } from "@/lib/utils";

interface GalleryProject {
  id: string;
  title: string;
  description: string;
  materialsUsed: { productId: string; name: string; quantity: number; unit: string }[];
  totalCost: number;
}

export default function GalleryPage() {
  const router = useRouter();
  const { addItem, toggleCart } = useCart();
  const { isAuthenticated } = useCustomerAuth();
  const [projects, setProjects] = useState<GalleryProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem("gallery_projects");
    if (stored) {
      setProjects(JSON.parse(stored));
      setLoading(false);
      return;
    }

    const defaultProjects: GalleryProject[] = [
      {
        id: "proj-1",
        title: "Amethyst Geode Collection Display",
        description: "A stunning collection of Uruguayan amethyst geodes and slices arranged for a crystal shop display. Each piece showcases deep purple crystals with natural agate banding.",
        materialsUsed: [
          { productId: "amethyst-geode-slice", name: "Amethyst Geode Slice", quantity: 15, unit: "pc" },
          { productId: "amethyst-cluster", name: "Amethyst Crystal Cluster", quantity: 8, unit: "pc" },
        ],
        totalCost: 45000,
      },
      {
        id: "proj-2",
        title: "Museum-Quality Fossil Exhibit",
        description: "Curated fossil collection featuring ammonites, trilobites, and petrified wood for a museum display. Each specimen is carefully selected for its preservation quality.",
        materialsUsed: [
          { productId: "ammonite-fossil", name: "Ammonite Fossil", quantity: 12, unit: "pc" },
          { productId: "trilobite-fossil", name: "Trilobite Fossil", quantity: 6, unit: "pc" },
        ],
        totalCost: 180000,
      },
      {
        id: "proj-3",
        title: "Crystal Jewelry Collection Launch",
        description: "Handcrafted gemstone jewelry set featuring amethyst, rose quartz, and labradorite pieces for a boutique launch. A coordinated collection of bracelets and pendants.",
        materialsUsed: [
          { productId: "amethyst-bracelet", name: "Amethyst Beaded Bracelet", quantity: 30, unit: "pc" },
          { productId: "labradorite-bracelet", name: "Labradorite Beaded Bracelet", quantity: 20, unit: "pc" },
        ],
        totalCost: 95000,
      },
      {
        id: "proj-4",
        title: "Polished Gemstone Showcase",
        description: "An elegant showcase of polished cabochons and faceted gemstones including labradorite, moonstone, and lapis lazuli. Perfect for a jewelry designer's studio.",
        materialsUsed: [
          { productId: "labradorite-cabochon", name: "Labradorite Cabochon", quantity: 50, unit: "pc" },
          { productId: "moonstone-cabochon", name: "Moonstone Cabochon", quantity: 30, unit: "pc" },
        ],
        totalCost: 78000,
      },
    ];

    setProjects(defaultProjects);
    sessionStorage.setItem("gallery_projects", JSON.stringify(defaultProjects));
    setLoading(false);
  }, []);

  const useThisDesign = (project: GalleryProject) => {
    if (!isAuthenticated) {
      sessionStorage.setItem("pendingCartItems", JSON.stringify(project.materialsUsed));
      router.push(`/login?redirect=/gallery`);
      return;
    }
    project.materialsUsed.forEach((mat) => {
      addItem({
        id: `gallery-${Date.now()}-${mat.productId}`,
        productId: mat.productId,
        name: mat.name,
        image: "",
        size: "Standard",
        quantity: mat.quantity,
        unitPrice: 0,
        totalPrice: 0,
      });
    });
    toggleCart();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-primary-400">
        Loading projects...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary-900">Collection Inspiration Gallery</h1>
        <p className="text-primary-500 mt-3 max-w-2xl mx-auto">
          Browse our curated collections for inspiration. Click &quot;Use This Design&quot; to automatically add the required items to your quote.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-white border border-primary-100 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="h-48 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
              <span className="text-6xl opacity-30">
                {project.id === "proj-1" ? "💎" : project.id === "proj-2" ? "🦕" : project.id === "proj-3" ? "📿" : "💠"}
              </span>
            </div>

            <div className="p-6">
              <h2 className="text-xl font-bold text-primary-900">{project.title}</h2>
              <p className="text-sm text-primary-500 mt-2 leading-relaxed">{project.description}</p>

              <div className="mt-4">
                <h3 className="text-xs font-semibold text-primary-700 uppercase tracking-wider mb-2">Items Used</h3>
                <div className="space-y-1.5">
                  {project.materialsUsed.map((mat, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-primary-600">{mat.name}</span>
                      <span className="text-primary-900 font-medium">{mat.quantity} {mat.unit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-primary-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-primary-500">Estimated Total Value</span>
                  <p className="text-xl font-bold text-accent-600">{formatPrice(project.totalCost)}</p>
                </div>
                <Button onClick={() => useThisDesign(project)}>
                  Use This Collection
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-primary-500 mb-4">
          Have a collection in mind? Use our Project Estimator for a custom quotation.
        </p>
        <Link href="/estimator">
          <Button variant="outline">Try Project Estimator</Button>
        </Link>
      </div>
    </div>
  );
}
