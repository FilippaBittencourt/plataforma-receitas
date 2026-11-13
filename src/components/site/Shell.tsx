import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { RecipeAssistant } from "./RecipeAssistant";
import type { Recipe } from "@/lib/mock-data";

export function Shell({
  children,
  assistantRecipe,
}: {
  children: ReactNode;
  assistantRecipe?: Recipe;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      {assistantRecipe ? <RecipeAssistant recipe={assistantRecipe} /> : <RecipeAssistant />}
    </div>
  );
}
