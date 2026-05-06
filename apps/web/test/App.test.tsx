import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "../src/App";

describe("App", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
    window.sessionStorage.clear();
  });

  it("calculates hardness from manual mineral input", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.clear(screen.getByLabelText(/Calcium/i));
    await user.type(screen.getByLabelText(/Calcium/i), "12");
    await user.clear(screen.getByLabelText(/Magnesium/i));
    await user.type(screen.getByLabelText(/Magnesium/i), "8");
    await user.clear(screen.getByLabelText(/Hydrogencarbonat/i));
    await user.type(screen.getByLabelText(/Hydrogencarbonat/i), "74");

    const resultSection = screen.getByRole("region", { name: /Dein Wasser/i });
    expect(within(resultSection).getByText("3,53")).toBeInTheDocument();
    expect(within(resultSection).getByText("3,39")).toBeInTheDocument();
  });

  it("starts with a clear catalog recommendation", () => {
    render(<App />);

    const resultSection = screen.getByRole("region", { name: /Dein Wasser/i });
    expect(
      within(resultSection).getByText(/Odenwald Quelle Gourmet Naturelle/i),
    ).toBeInTheDocument();
    expect(within(resultSection).getByText("2,06")).toBeInTheDocument();
    expect(within(resultSection).getByText("2,11")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("navigates between app routes via the top navigation", async () => {
    const user = userEvent.setup();
    render(<App />);

    const nav = screen.getByRole("navigation", { name: /Bereiche/i });

    expect(within(nav).getByRole("link", { name: /^Rechner$/i })).toHaveAttribute("href", "/");
    expect(within(nav).getByRole("link", { name: /Wasser Datenbank/i })).toHaveAttribute(
      "href",
      "/datenbank",
    );
    expect(within(nav).getByRole("link", { name: /Quellen & Wissen/i })).toHaveAttribute(
      "href",
      "/wissen",
    );
    expect(within(nav).getByRole("link", { name: /Über das Projekt/i })).toHaveAttribute(
      "href",
      "/projekt",
    );

    await user.click(within(nav).getByRole("link", { name: /Quellen & Wissen/i }));
    expect(window.location.pathname).toBe("/wissen");
    expect(
      screen.getByRole("heading", { name: /Was der Rechner wirklich berechnet/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /Mineralwasser Datenbank/i }),
    ).not.toBeInTheDocument();

    await user.click(within(nav).getByRole("link", { name: /Wasser Datenbank/i }));
    expect(window.location.pathname).toBe("/datenbank");
    expect(screen.getByRole("heading", { name: /Mineralwasser vergleichen/i })).toBeInTheDocument();
  });

  it("filters the water catalog by search text", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("link", { name: /Wasser Datenbank/i }));
    await user.type(screen.getByRole("searchbox", { name: /Wasser suchen/i }), "Black Forest");

    const catalog = screen.getByRole("region", { name: /Mineralwasser Datenbank/i });
    expect(within(catalog).getByText(/Black Forest/i)).toBeInTheDocument();
    expect(within(catalog).queryByText(/Gerolsteiner/i)).not.toBeInTheDocument();
  });

  it("hides target summary badges for weak matches", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("link", { name: /Wasser Datenbank/i }));
    await user.type(screen.getByRole("searchbox", { name: /Wasser suchen/i }), "Gerolsteiner");

    const catalog = screen.getByRole("region", { name: /Mineralwasser Datenbank/i });
    expect(within(catalog).getAllByText(/deutlich daneben/i).length).toBeGreaterThan(0);
    expect(within(catalog).queryByText(/Am ehesten/i)).not.toBeInTheDocument();
    expect(within(catalog).queryByText(/Beste Note 6/i)).not.toBeInTheDocument();
  });

  it("changes sort mode and grade filtering", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("link", { name: /Wasser Datenbank/i }));
    await user.click(screen.getByRole("button", { name: /^Filter$/i }));
    await user.selectOptions(screen.getByLabelText(/Notenfilter/i), "top");

    expect(screen.getByRole("button", { name: /^Filter$/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      within(screen.getByRole("region", { name: /Mineralwasser Datenbank/i })).getAllByText(
        /sehr gut|gut/i,
      ).length,
    ).toBeGreaterThan(0);
  });
});
