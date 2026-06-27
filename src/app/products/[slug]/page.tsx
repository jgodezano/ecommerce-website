"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { formatPrice } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import ProductCard from "@/components/products/ProductCard";
import type { Product, ProductSize } from "@/types";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem, toggleCart } = useCart();
  const { isAuthenticated: isCustomerAuth } = useCustomerAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [stockError, setStockError] = useState("");

  useEffect(() => {
    fetch(`/api/products?slug=${params.slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.product) {
          setProduct(data.product);
          if (data.product.categoryId) {
            fetch(`/api/products?category=${data.product.categoryId}&sort=name_asc`)
              .then((r) => r.json())
              .then((rel) => {
                setRelated((rel.products || []).filter((p: Product) => p.id !== data.product.id).slice(0, 4));
              })
              .catch(() => {});
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.slug]);

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><p className="text-primary-400">Loading...</p></div>;
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary-900 mb-4">Product Not Found</h1>
          <p className="text-primary-500 mb-6">The product you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link href="/categories/hollow-blocks">
            <Button>Browse Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  const selectedSize = product.sizes[selectedSizeIdx] || { name: "Standard", dimensions: "", price: product.price, stock: product.stock };
  const realTimeStock = selectedSize.stock ?? product.stock;
  const realTimeStatus = realTimeStock <= 0 ? "out_of_stock" : realTimeStock <= 50 ? "low_stock" : "in_stock";

  const images: string[] = (product.images?.length ? product.images : ["/images/placeholder.svg"]);

  const handleAddToCart = () => {
    if (!isCustomerAuth) {
      sessionStorage.setItem("pendingCartItem", JSON.stringify({
        id: `${product.id}-${selectedSize.name}`,
        productId: product.id,
        name: product.name,
        image: images[0],
        size: selectedSize.name,
        quantity,
        unitPrice: selectedSize.price,
        totalPrice: selectedSize.price * quantity,
      }));
      router.push(`/login?redirect=/products/${product.slug}`);
      return;
    }

    setStockError("");

    if (realTimeStock < quantity) {
      setStockError(`Only ${realTimeStock} unit(s) available. Please reduce quantity.`);
      return;
    }

    addItem({
      id: `${product.id}-${selectedSize.name}`,
      productId: product.id,
      name: product.name,
      image: images[0],
      size: selectedSize.name,
      quantity,
      unitPrice: selectedSize.price,
      totalPrice: selectedSize.price * quantity,
    });
    toggleCart();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-primary-500 mb-6">
        <Link href="/" className="hover:text-accent-600">Home</Link>
        <span>/</span>
        <Link href={`/categories/${product.categoryId}`} className="hover:text-accent-600">{product.category || "Products"}</Link>
        <span>/</span>
        <span className="text-primary-900 font-medium">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery */}
        <div>
          <div className="relative aspect-square bg-primary-100 rounded-2xl overflow-hidden">
            <Image
              src={images[activeImage] || images[0]}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
            {product.bestSeller && (
              <div className="absolute top-4 left-4">
                <Badge variant="warning" className="text-sm px-3 py-1">Best Seller</Badge>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-3 mt-4">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors ${
                    activeImage === i ? "border-accent-500" : "border-primary-200 hover:border-primary-300"
                  }`}
                >
                  <div className="relative w-full h-full bg-primary-100">
                    <Image src={img} alt="" fill className="object-cover" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <p className="text-sm font-semibold text-accent-600 uppercase tracking-wider">{product.category || product.materialType || "Product"}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-900 mt-1">{product.name}</h1>
          <p className="text-sm text-primary-500 mt-1">SKU: {product.sku}</p>

          <div className="flex items-center gap-3 mt-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              realTimeStatus === "in_stock" ? "text-green-600 bg-green-50" :
              realTimeStatus === "low_stock" ? "text-yellow-600 bg-yellow-50" :
              "text-red-600 bg-red-50"
            }`}>
              {realTimeStatus === "in_stock" ? "In Stock" : realTimeStatus === "low_stock" ? "Low Stock" : "Out of Stock"}
            </span>
            {realTimeStock > 0 && (
              <span className="text-sm text-primary-500">{realTimeStock} units available</span>
            )}
          </div>

          <p className="text-primary-600 mt-4 leading-relaxed">{product.description}</p>

          {/* Size Selection */}
          {product.sizes.length > 1 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-primary-900 mb-3">Available Sizes:</h3>
              <div className="flex flex-wrap gap-3">
                {product.sizes.map((size, i) => (
                  <button
                    key={size.name}
                    onClick={() => { setSelectedSizeIdx(i); setQuantity(1); }}
                    className={`px-4 py-3 rounded-xl text-left border-2 transition-all ${
                      selectedSizeIdx === i
                        ? "border-accent-500 bg-accent-50"
                        : "border-primary-200 hover:border-primary-300"
                    }`}
                  >
                    <p className="text-sm font-semibold text-primary-900">{size.name}</p>
                    <p className="text-xs text-primary-500">{size.dimensions}</p>
                    <p className="text-sm font-bold text-accent-600 mt-1">{formatPrice(size.price)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fixed single size display */}
          {product.sizes.length <= 1 && (
            <div className="mt-6 p-4 bg-primary-50 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary-900">{selectedSize.name}</p>
                  <p className="text-xs text-primary-500">{selectedSize.dimensions}</p>
                </div>
                <p className="text-xl font-bold text-accent-600">{formatPrice(selectedSize.price)}</p>
              </div>
            </div>
          )}

          {/* Quantity & Add to Cart */}
          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center border border-primary-200 rounded-xl">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-3 text-primary-500 hover:text-primary-700"
              >
                &minus;
              </button>
              <span className="px-4 py-3 text-lg font-bold text-primary-900 min-w-[3rem] text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-4 py-3 text-primary-500 hover:text-primary-700"
              >
                +
              </button>
            </div>
            <span className="text-sm text-primary-500">{product.unit}(s)</span>
          </div>

          {stockError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {stockError}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              size="lg"
              className="flex-1 text-base"
              onClick={handleAddToCart}
              disabled={realTimeStatus === "out_of_stock"}
            >
              {realTimeStatus === "out_of_stock" ? "Out of Stock" : "Add to Cart"}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex-1 text-base"
              onClick={() => {
                if (!isCustomerAuth) {
                  router.push(`/login?redirect=/quote?product=${product.slug}`);
                } else {
                  router.push(`/quote?product=${product.slug}`);
                }
              }}
            >
              Request Quote
            </Button>
          </div>

          {/* Wholesale info */}
          {product.wholesalePrice && (
            <div className="mt-4 p-4 bg-accent-50 border border-accent-200 rounded-xl">
              <p className="text-sm font-semibold text-accent-800">💼 Bulk Pricing Available</p>
              <p className="text-sm text-accent-700 mt-1">
                {formatPrice(product.wholesalePrice)} per {product.unit} (min. {product.minWholesaleQty} {product.unit}s)
              </p>
            </div>
          )}

          {/* Delivery info */}
          <div className="mt-4 p-4 bg-primary-50 rounded-xl">
            <p className="text-sm font-semibold text-primary-900">🚚 Delivery Information</p>
            <p className="text-sm text-primary-600 mt-1">{product.deliveryInfo}</p>
          </div>

          {/* Specifications */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-primary-900 mb-3">Specifications</h3>
            <div className="grid grid-cols-2 gap-3">
              {(product.specifications || []).map((spec, i) => (
                <div key={i} className="flex flex-col">
                  <span className="text-xs text-primary-500">{spec.label}</span>
                  <span className="text-sm font-medium text-primary-900">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="heading-3 text-primary-900 mb-6">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
