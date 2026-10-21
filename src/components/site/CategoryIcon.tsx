import type { ReactNode, SVGProps } from "react";

// Ícones desenhados no mesmo traço do lucide (24×24, stroke 1.75, currentColor).
const paths: Record<string, ReactNode> = {
  // Pudim no prato, com calda escorrendo e cereja
  doces: (
    <>
      <path d="M7 17l1.2-7.2a1 1 0 0 1 1-.8h5.6a1 1 0 0 1 1 .8L17 17" />
      <path d="M8.6 11.5c1.1 0 1.2 1.5 2.2 1.5s1-1.5 2.4-1.5 1.2 1.5 2.2 1.5" />
      <circle cx="12" cy="6.6" r="1.6" />
      <path d="M3.5 17h17" />
      <path d="M6.5 19.5h11" />
    </>
  ),
  // Baguete com cortes
  paes: (
    <g transform="rotate(-35 12 12)">
      <rect x="2" y="9" width="20" height="6" rx="3" />
      <path d="M7 10.6l1.4 2.8M11.3 10.6l1.4 2.8M15.6 10.6l1.4 2.8" />
    </g>
  ),
  // Tigela de macarrão com garfo
  massas: (
    <>
      <path d="M3.5 12.5h17" />
      <path d="M4.5 12.5a7.5 7 0 0 0 15 0" />
      <path d="M9.5 19.5h5" />
      <path d="M7 12.5c0-2.3 2.1-3.8 4.8-3.8 1 0 1.9.2 2.7.6" />
      <path d="M16.5 12.5V7" />
      <path d="M15 3v2.5a1.5 1.5 0 0 0 3 0V3" />
    </>
  ),
  // Bife com osso e marmoreio
  carnes: (
    <>
      <path d="M4.5 10.5C4.5 6.6 8 4 12.5 4 17 4 20 6.6 20 10.2c0 3-2 4.7-4.6 5.7-1.8.7-2.8 1.8-3.8 3.3-1.1 1.6-3.2 1.9-4.6.6C5.4 18.3 4.5 15 4.5 10.5z" />
      <circle cx="14.5" cy="9.5" r="2" />
      <path d="M8 14c1-1.1 2.3-1.6 3.6-1.6" />
      <path d="M7.5 9.5c.6-1.4 1.6-2.3 3-2.8" />
    </>
  ),
  // Folha com nervuras
  vegetariano: (
    <>
      <path d="M5.5 18.5C5.5 10.2 10 5.5 19 5c-.4 8.8-5 13.5-13.5 13.5z" />
      <path d="M5.5 18.5l9-9" />
    </>
  ),
  // Cuia de chimarrão com bomba
  bebidas: (
    <>
      <path d="M6.2 10h11.6" />
      <path d="M6.2 10c-.2 5.6 2.3 10 5.8 10s6-4.4 5.8-10" />
      <path d="M8.6 10c.8-.9 2-1.4 3.4-1.4" />
      <path d="M13.9 10L17.4 3" />
      <path d="M16.6 3h1.8" />
      <path d="M7 13.5h10" />
    </>
  ),
};

export function CategoryIcon({
  id,
  size = 24,
  ...props
}: { id: string; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {paths[id]}
    </svg>
  );
}
