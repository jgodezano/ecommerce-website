export default function WhyChooseUs() {
  const features = [
    {
      icon: "✅",
      title: "Quality Materials",
      description: "All products undergo strict quality control from reputable manufacturers.",
    },
    {
      icon: "💰",
      title: "Competitive Pricing",
      description: "Best value with wholesale pricing for bulk orders and price match guarantees.",
    },
    {
      icon: "📦",
      title: "Bulk Orders Available",
      description: "From small renovations to large developments, we handle orders of any size.",
    },
    {
      icon: "🚚",
      title: "Nationwide Delivery",
      description: "Reliable delivery across the Philippines with real-time tracking.",
    },
    {
      icon: "👷",
      title: "Trusted by Contractors",
      description: "Preferred supplier for leading construction firms and professionals.",
    },
    {
      icon: "🛠️",
      title: "Expert Support",
      description: "Our team of construction experts is ready to help you choose the right materials.",
    },
  ];

  return (
    <section className="py-10 lg:py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900">Why Choose Merica House of Rocks?</h2>
          <p className="text-gray-500 mt-2 max-w-xl mx-auto">What sets us apart from other construction material suppliers</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-4 p-5 bg-gray-50 rounded-xl border border-gray-100 hover:bg-accent-50 hover:border-accent-100 transition-colors">
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
