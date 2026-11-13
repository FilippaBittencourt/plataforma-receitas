import { Beef, CakeSlice, CookingPot, CupSoda, Croissant, Leaf } from "lucide-react";
import type { SVGProps } from "react";

const icons = {
  doces: CakeSlice,
  paes: Croissant,
  massas: CookingPot,
  carnes: Beef,
  vegetariano: Leaf,
  bebidas: CupSoda,
};

export function CategoryIcon({
  id,
  size = 24,
  ...props
}: { id: string; size?: number } & SVGProps<SVGSVGElement>) {
  const Icon = icons[id as keyof typeof icons] ?? CookingPot;
  return <Icon width={size} height={size} aria-hidden="true" {...props} />;
}
