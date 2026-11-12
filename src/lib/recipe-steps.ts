export const RECIPE_SECTION_PREFIX = "[[LIPAPA_SECAO]] ";
export const RECIPE_INGREDIENT_SECTION_PREFIX = "[[LIPAPA_INGREDIENTE_SECAO]] ";

export type RecipeEditorBlock = {
  id: string;
  type: "section" | "step";
  text: string;
};

let blockSequence = 0;

export function createRecipeBlock(type: RecipeEditorBlock["type"], text = ""): RecipeEditorBlock {
  blockSequence += 1;
  return { id: `recipe-block-${blockSequence}`, type, text };
}

export function decodeRecipeSteps(steps: string[] | null | undefined): RecipeEditorBlock[] {
  return (steps ?? []).map((step) =>
    step.startsWith(RECIPE_SECTION_PREFIX)
      ? createRecipeBlock("section", step.slice(RECIPE_SECTION_PREFIX.length))
      : createRecipeBlock("step", step),
  );
}

export function encodeRecipeSteps(blocks: RecipeEditorBlock[]): string[] {
  return blocks.map((block) =>
    block.type === "section" ? `${RECIPE_SECTION_PREFIX}${block.text.trim()}` : block.text.trim(),
  );
}

export function getRecipeSectionTitle(step: string): string | null {
  return step.startsWith(RECIPE_SECTION_PREFIX)
    ? step.slice(RECIPE_SECTION_PREFIX.length).trim()
    : null;
}

export function formatRecipeStepForAssistant(step: string): string {
  const title = getRecipeSectionTitle(step);
  return title ? `Seção: ${title}` : step;
}

export function encodeIngredientSection(title: string): string {
  return `${RECIPE_INGREDIENT_SECTION_PREFIX}${title.trim()}`;
}

export function getRecipeIngredientSectionTitle(value: string | null | undefined): string | null {
  return value?.startsWith(RECIPE_INGREDIENT_SECTION_PREFIX)
    ? value.slice(RECIPE_INGREDIENT_SECTION_PREFIX.length).trim()
    : null;
}

export function formatRecipeIngredientForAssistant(ingredient: string): string {
  return ingredient.startsWith(RECIPE_INGREDIENT_SECTION_PREFIX)
    ? `Seção de ingredientes: ${ingredient.slice(RECIPE_INGREDIENT_SECTION_PREFIX.length).trim()}`
    : ingredient;
}
