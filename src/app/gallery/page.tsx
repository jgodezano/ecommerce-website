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
        title: "Modern Garden Pathway",
        description: "Beautiful crazy cut stone pathway with granite borders for a residential garden in Lipa. Creates a natural, elegant walkway that complements any landscape design.",
        materialsUsed: [
          { productId: "crazy-cut-1", name: "Crazy Cut Stone - Grey", quantity: 150, unit: "pc" },
          { productId: "granite-1", name: "Granite Tile - Grey", quantity: 30, unit: "pc" },
        ],
        totalCost: 45000,
      },
      {
        id: "proj-2",
        title: "Commercial Building Facade",
        description: "Elegant wall cladding using natural stone veneers for a commercial building facade. Provides a premium, professional look that attracts customers and clients.",
        materialsUsed: [
          { productId: "veneer-1", name: "Stone Veneer - Grey", quantity: 200, unit: "pc" },
          { productId: "adobe-1", name: "Adobe Block - Red", quantity: 500, unit: "pc" },
        ],
        totalCost: 180000,
      },
      {
        id: "proj-3",
        title: "Driveway Pavers Installation",
        description: "Durable interlocking pavers for a residential driveway with proper base preparation. Designed to withstand heavy vehicle traffic while maintaining a stylish appearance.",
        materialsUsed: [
          { productId: "pavers-1", name: "Pavers - Hexagon", quantity: 300, unit: "pc" },
          { productId: "gravel-1", name: "Gravel - 3/4-inch", quantity: 5, unit: "cu.m." },
        ],
        totalCost: 95000,
      },
      {
        id: "proj-4",
        title: "Retaining Wall with Cobblestones",
        description: "Strong and attractive retaining wall built with premium cobblestones. Perfect for sloped properties requiring erosion control and aesthetic landscaping.",
        materialsUsed: [
          { productId: "cobblestone-1", name: "Cobblestone - Black", quantity: 400, unit: "pc" },
          { productId: "gravel-1", name: "Gravel - 3/4-inch", quantity: 3, unit: "cu.m." },
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
        <h1 className="text-3xl sm:text-4xl font-bold text-primary-900">Project Inspiration Gallery</h1>
        <p className="text-primary-500 mt-3 max-w-2xl mx-auto">
          Browse our completed projects for inspiration. Click &quot;Use This Design&quot; to automatically add the required materials to your cart.
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
                {project.id === "proj-1" ? "🌿" : project.id === "proj-2" ? "🏢" : project.id === "proj-3" ? "🚗" : "🧱"}
              </span>
            </div>

            <div className="p-6">
              <h2 className="text-xl font-bold text-primary-900">{project.title}</h2>
              <p className="text-sm text-primary-500 mt-2 leading-relaxed">{project.description}</p>

              <div className="mt-4">
                <h3 className="text-xs font-semibold text-primary-700 uppercase tracking-wider mb-2">Materials Used</h3>
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
                  <span className="text-xs text-primary-500">Estimated Project Cost</span>
                  <p className="text-xl font-bold text-accent-600">{formatPrice(project.totalCost)}</p>
                </div>
                <Button onClick={() => useThisDesign(project)}>
                  Use This Design
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-primary-500 mb-4">
          Have a project in mind? Use our Project Estimator for a custom calculation.
        </p>
        <Link href="/estimator">
          <Button variant="outline">Try Project Estimator</Button>
        </Link>
      </div>
    </div>
  );
}
