import HeroSection from "@/components/home/HeroSection";
import PopularCategories from "@/components/home/PopularCategories";
import BestSellers from "@/components/home/BestSellers";
import HowToOrder from "@/components/home/HowToOrder";
import ValueAddedServices from "@/components/home/ValueAddedServices";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import Testimonials from "@/components/home/Testimonials";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <PopularCategories />
      <BestSellers />
      <HowToOrder />
      <ValueAddedServices />
      <WhyChooseUs />
      <Testimonials />
    </>
  );
}
