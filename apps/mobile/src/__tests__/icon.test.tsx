import { render, screen } from "@testing-library/react-native";
import { Button } from "@/components/button";
import { Icon } from "@/components/icon";

describe("iconos decorativos", () => {
  it("se ocultan al lector de pantalla", async () => {
    await render(<Icon name="checkmark" testID="icono" />);
    const icon = screen.getByTestId("icono", { includeHiddenElements: true });
    expect(icon.props.accessibilityElementsHidden).toBe(true);
    expect(icon.props.importantForAccessibility).toBe("no-hide-descendants");
    expect(screen.queryByTestId("icono")).toBeNull();
  });

  it("un botón con icono se anuncia solo con su texto", async () => {
    await render(<Button label="Guardar" icon="checkmark" onPress={() => undefined} />);
    expect(screen.getByRole("button", { name: "Guardar" })).toBeTruthy();
  });
});
