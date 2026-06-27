import { DeliveryZone } from "@/types";

export const deliveryZones: DeliveryZone[] = [
  {
    id: "zone-1",
    name: "Metro Manila",
    coverage: "All cities within Metro Manila",
    fee: 0,
    minOrderForFree: 5000,
    estimatedDays: "1-2 business days",
  },
  {
    id: "zone-2",
    name: "Provincial - Luzon (within 50km)",
    coverage: "Cities and municipalities within 50km of our warehouse",
    fee: 1500,
    minOrderForFree: 15000,
    estimatedDays: "2-3 business days",
  },
  {
    id: "zone-3",
    name: "Provincial - Luzon (50-150km)",
    coverage: "Areas 50-150km from our warehouse",
    fee: 3000,
    minOrderForFree: 25000,
    estimatedDays: "3-5 business days",
  },
  {
    id: "zone-4",
    name: "Provincial - Luzon (150km+)",
    coverage: "Areas more than 150km from our warehouse",
    fee: 5000,
    minOrderForFree: 40000,
    estimatedDays: "5-7 business days",
  },
  {
    id: "zone-5",
    name: "Visayas & Mindanao",
    coverage: "Major cities in Visayas and Mindanao (shipped via cargo)",
    fee: 8000,
    minOrderForFree: 50000,
    estimatedDays: "7-14 business days",
  },
];

export const deliveryFeePerKm = 25;
export const freeShippingRadius = 30;
export const truckDeliveryRate = 12000;
