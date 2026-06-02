import { Bike } from "lucide-react";

export default function BadgeDelivery({ small }: { small?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium bg-commerce text-white rounded-pill ${
        small ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2.5 py-1"
      }`}
    >
      <Bike size={small ? 10 : 12} strokeWidth={2} />
      Delivery
    </span>
  );
}
