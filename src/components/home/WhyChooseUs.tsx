export default function WhyChooseUs() {
  const features = [
    {
      icon: "💎",
      title: "Authentic Gemstones",
      description: "All specimens and gemstones are verified authentic. No imitations or synthetics sold as natural.",
    },
    {
      icon: "💰",
      title: "Fair Pricing",
      description: "Competitive prices on all crystals, fossils, and gemstone products with wholesale discounts available.",
    },
    {
      icon: "📦",
      title: "Bulk Orders Available",
      description: "From single collector pieces to bulk wholesale orders for retailers and designers.",
    },
    {
      icon: "🚚",
      title: "Nationwide Delivery",
      description: "Reliable delivery across the Philippines with careful packaging for fragile specimens.",
    },
    {
      icon: "🔬",
      title: "Expert Knowledge",
      description: "Our team has deep knowledge of mineralogy, geology, and gemstone quality assessment.",
    },
    {
      icon: "🎁",
      title: "Gift Ready Packaging",
      description: "Every piece comes beautifully packaged, ready for gifting or display.",
    },
  ];

  return (
    <section className="py-10 lg:py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900">Why Choose Merica House of Rocks?</h2>
          <p className="text-gray-500 mt-2 max-w-xl mx-auto">What sets us apart from other gemstone suppliers</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-4 p-5 bg-gray-50 rounded-xl border border-gray-100 hover:bg-primary-50 hover:border-primary-100 transition-colors">
              <span className="text-2xl shrink-0">{feature.icon}</span>
              <div>
                <h3 className="text-sm font-bold text-gray-900">{feature.title}</h3>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
