import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppHeader } from "./AppHeader";

describe("AppHeader", () => {
  it("links to the projects list", () => {
    render(
      <MemoryRouter>
        <AppHeader />
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: /synapse/i })).toHaveAttribute(
      "href",
      "/projects"
    );
  });
});
