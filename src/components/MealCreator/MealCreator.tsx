import ComponentsPanel from "./ComponentsPanel";
import MealsPanel from "./MealsPanel";

/**
 * Two-column layout for building the meal component and meal libraries.
 */
function MealCreator() {
  return (
    <div className="grid flex-1 grid-cols-2 gap-5">
      <ComponentsPanel />
      <MealsPanel />
    </div>
  );
}

export default MealCreator;
