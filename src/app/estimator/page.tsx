"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useCart } from "@/context/CartContext";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { formatPrice } from "@/lib/utils";
import {
  estimateWall,
  estimateFloorSlab,
  estimateColumn,
  MaterialEstimate,
} from "@/lib/estimator";

type ProjectType = "wall" | "floor" | "column";

export default function EstimatorPage() {
  const router = useRouter();
  const { addItem, toggleCart } = useCart();
  const { isAuthenticated } = useCustomerAuth();
  const [projectType, setProjectType] = useState<ProjectType>("wall");

  const [wallDims, setWallDims] = useState<{ length: number; height: number; thickness: "4" | "6" | "8" }>({ length: 5, height: 3, thickness: "6" });
  const [floorDims, setFloorDims] = useState({ length: 4, width: 3, thickness: 10 });
  const [colDims, setColDims] = useState({ height: 3, width: 30, depth: 30 });

  const [result, setResult] = useState<{
    materials: MaterialEstimate[];
    subtotal: number;
    notes: string[];
  } | null>(null);
  const [error, setError] = useState("");

  const calculate = () => {
    setError("");
    try {
      let r;
      switch (projectType) {
        case "wall":
          if (wallDims.length <= 0 || wallDims.height <= 0) {
            setError("Please enter valid dimensions");
            return;
          }
          r = estimateWall(wallDims);
          break;
        case "floor":
          if (floorDims.length <= 0 || floorDims.width <= 0 || floorDims.thickness <= 0) {
            setError("Please enter valid dimensions");
            return;
          }
          r = estimateFloorSlab(floorDims);
          break;
        case "column":
          if (colDims.height <= 0 || colDims.width <= 0 || colDims.depth <= 0) {
            setError("Please enter valid dimensions");
            return;
          }
          r = estimateColumn(colDims.height, colDims.width, colDims.depth);
          break;
      }
      if (r) setResult(r);
    } catch {
      setError("Calculation failed. Please check your inputs.");
    }
  };

  const addToCart = (material: MaterialEstimate) => {
    if (!isAuthenticated) {
      sessionStorage.setItem("pendingCartItem", JSON.stringify({
        id: `est-${Date.now()}`,
        productId: material.productId || `est-${material.name}`,
        name: material.name,
        image: "",
        size: "Standard",
        quantity: Math.ceil(material.quantity),
        unitPrice: material.unitPrice,
        totalPrice: material.totalPrice,
      }));
      router.push("/login?redirect=/estimator");
      return;
    }
    addItem({
      id: `est-${Date.now()}`,
      productId: material.productId || `est-${material.name}`,
      name: `${material.name} (Estimate)`,
      image: "",
      size: "Standard",
      quantity: Math.ceil(material.quantity),
      unitPrice: material.unitPrice,
      totalPrice: material.totalPrice,
    });
    toggleCart();
  };

  const addAllToCart = () => {
    if (!result) return;
    if (!isAuthenticated) {
      router.push("/login?redirect=/estimator");
      return;
    }
    result.materials.forEach((m) => {
      addItem({
        id: `est-${Date.now()}-${m.name}`,
        productId: m.productId || `est-${m.name}`,
        name: `${m.name} (Estimate)`,
        image: "",
        size: "Standard",
        quantity: Math.ceil(m.quantity),
        unitPrice: m.unitPrice,
        totalPrice: m.totalPrice,
      });
    });
    toggleCart();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary-900">Project Estimator</h1>
        <p className="text-primary-500 mt-3 max-w-2xl mx-auto">
          Enter your project dimensions to get an instant material estimate with pricing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-primary-100 rounded-xl p-6">
          <h2 className="text-lg font-bold text-primary-900 mb-4">Project Details</h2>

          <div className="flex gap-3 mb-6">
            {([
              { value: "wall", label: "Wall", icon: "🧱" },
              { value: "floor", label: "Floor Slab", icon: "🏗️" },
              { value: "column", label: "Column", icon: "⬛" },
            ] as const).map((type) => (
              <button
                key={type.value}
                onClick={() => { setProjectType(type.value); setResult(null); }}
                className={`flex-1 p-4 rounded-xl border-2 text-center transition-all ${
                  projectType === type.value ? "border-accent-500 bg-accent-50" : "border-primary-200 hover:border-primary-300"
                }`}
              >
                <span className="text-2xl">{type.icon}</span>
                <p className="text-sm font-semibold text-primary-900 mt-1">{type.label}</p>
              </button>
            ))}
          </div>

          {projectType === "wall" && (
            <div className="space-y-4">
              <Input label="Wall Length (meters)" id="wLength" type="number" value={wallDims.length.toString()} onChange={(e) => setWallDims({ ...wallDims, length: parseFloat(e.target.value) || 0 })} />
              <Input label="Wall Height (meters)" id="wHeight" type="number" value={wallDims.height.toString()} onChange={(e) => setWallDims({ ...wallDims, height: parseFloat(e.target.value) || 0 })} />
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Wall Thickness</label>
                <div className="flex gap-3">
                  {(["4", "6", "8"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setWallDims({ ...wallDims, thickness: t })}
                      className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                        wallDims.thickness === t ? "border-accent-500 bg-accent-50 text-accent-700" : "border-primary-200 text-primary-600 hover:border-primary-300"
                      }`}
                    >
                      {t}"
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {projectType === "floor" && (
            <div className="space-y-4">
              <Input label="Length (meters)" id="fLength" type="number" value={floorDims.length.toString()} onChange={(e) => setFloorDims({ ...floorDims, length: parseFloat(e.target.value) || 0 })} />
              <Input label="Width (meters)" id="fWidth" type="number" value={floorDims.width.toString()} onChange={(e) => setFloorDims({ ...floorDims, width: parseFloat(e.target.value) || 0 })} />
              <Input label="Thickness (cm)" id="fThick" type="number" value={floorDims.thickness.toString()} onChange={(e) => setFloorDims({ ...floorDims, thickness: parseFloat(e.target.value) || 0 })} />
            </div>
          )}

          {projectType === "column" && (
            <div className="space-y-4">
              <Input label="Height (meters)" id="cHeight" type="number" value={colDims.height.toString()} onChange={(e) => setColDims({ ...colDims, height: parseFloat(e.target.value) || 0 })} />
              <Input label="Width (cm)" id="cWidth" type="number" value={colDims.width.toString()} onChange={(e) => setColDims({ ...colDims, width: parseFloat(e.target.value) || 0 })} />
              <Input label="Depth (cm)" id="cDepth" type="number" value={colDims.depth.toString()} onChange={(e) => setColDims({ ...colDims, depth: parseFloat(e.target.value) || 0 })} />
            </div>
          )}

          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

          <Button size="lg" className="w-full mt-6" onClick={calculate}>
            Calculate Materials
          </Button>
        </div>

        {result && (
          <div className="bg-white border border-primary-100 rounded-xl p-6">
            <h2 className="text-lg font-bold text-primary-900 mb-4">Material Estimate</h2>

            <div className="space-y-3 mb-6">
              {result.materials.map((m, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-primary-50 rounded-xl">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-primary-900">{m.name}</p>
                    <p className="text-xs text-primary-500">{Math.ceil(m.quantity)} {m.unit} x {formatPrice(m.unitPrice)}</p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <p className="text-sm font-bold text-accent-600">{formatPrice(m.totalPrice)}</p>
                    <Button size="sm" onClick={() => addToCart(m)} disabled={!m.productId}>
                      Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-primary-200 pt-4">
              <div className="flex justify-between text-lg font-bold text-primary-900">
                <span>Total Estimated Cost</span>
                <span>{formatPrice(result.subtotal)}</span>
              </div>
            </div>

            <Button size="lg" className="w-full mt-4" onClick={addAllToCart}>
              Add All to Cart
            </Button>

            <div className="mt-4 p-3 bg-accent-50 border border-accent-200 rounded-xl">
              <p className="text-xs font-semibold text-accent-700 mb-1">Notes:</p>
              {result.notes.map((note, i) => (
                <p key={i} className="text-xs text-accent-600">• {note}</p>
              ))}
            </div>
          </div>
        )}

        {!result && (
          <div className="bg-primary-50 border border-primary-100 rounded-xl p-6 flex items-center justify-center">
            <div className="text-center text-primary-400">
              <span className="text-4xl block mb-2">📐</span>
              <p className="text-sm">Enter your project dimensions and click Calculate to see material estimates</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
