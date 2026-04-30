import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "../src/App";

describe("App", () => {
  it("calculates hardness from manual mineral input", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.clear(screen.getByLabelText(/Calcium/i));
    await user.type(screen.getByLabelText(/Calcium/i), "12");
    await user.clear(screen.getByLabelText(/Magnesium/i));
    await user.type(screen.getByLabelText(/Magnesium/i), "8");
    await user.clear(screen.getByLabelText(/Hydrogencarbonat/i));
    await user.type(screen.getByLabelText(/Hydrogencarbonat/i), "74");

    const resultSection = screen.getByRole("region", { name: /Aktuelles Profil/i });
    expect(within(resultSection).getByText("3,53")).toBeInTheDocument();
    expect(within(resultSection).getByText("3,39")).toBeInTheDocument();
  });

  it("starts with an empty manual profile", () => {
    render(<App />);

    const resultSection = screen.getByRole("region", { name: /Aktuelles Profil/i });
    expect(within(resultSection).getByText(/Wähle ein Wasser/i)).toBeInTheDocument();
    expect(within(resultSection).getAllByText("–")).toHaveLength(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("filters the water catalog by search text", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByRole("searchbox", { name: /Wasser suchen/i }), "Black Forest");

    const catalog = screen.getByRole("region", { name: /Mineralwasser-Datenbank/i });
    expect(
      within(catalog).getByRole("heading", { name: /Mineralwasser im Vergleich/i }),
    ).toBeInTheDocument();
    expect(within(catalog).getByRole("heading", { name: /Black Forest/i })).toBeInTheDocument();
    expect(
      within(catalog).queryByRole("heading", { name: /Gerolsteiner/i }),
    ).not.toBeInTheDocument();
  });

  it("changes sort mode and grade filtering", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Filterkaffee/i }));
    await user.selectOptions(screen.getByLabelText(/Notenfilter/i), "top");

    expect(screen.getByRole("button", { name: /Filterkaffee/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      within(screen.getByRole("region", { name: /Mineralwasser-Datenbank/i })).getAllByText(
        /Note [12]/,
      ).length,
    ).toBeGreaterThan(0);
  });
});
