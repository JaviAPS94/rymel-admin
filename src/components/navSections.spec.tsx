/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Link, Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { Navbar, RymelUIProvider } from "@rymel/ui";
import { buildSections, SECTIONS } from "./navSections";
import appSource from "../App.tsx?raw";

const labels = (location: string, isAdmin: boolean) =>
  Object.fromEntries(
    buildSections(location, isAdmin).map((section) => [
      section.label,
      section.items?.map((item) => item.label) ?? [],
    ]),
  );

describe("secciones de la barra", () => {
  it("un ADMIN ve todos los catálogos y toda la administración", () => {
    expect(labels("/dashboard", true)).toEqual({
      Dashboard: [],
      Catálogos: ["Materiales", "Semielaborados", "Fantasmas"],
      Administración: ["Usuarios", "Reglas de código", "Fórmulas", "Plantillas", "Diseños"],
    });
  });

  it("sin rol ADMIN solo quedan Materiales, Fantasmas y Usuarios", () => {
    expect(labels("/dashboard", false)).toEqual({
      Dashboard: [],
      Catálogos: ["Materiales", "Fantasmas"],
      Administración: ["Usuarios"],
    });
  });

  it("no ofrece Recursos ni Configuración", () => {
    const hrefs = buildSections("/", true).flatMap((section) => [
      section.href,
      ...(section.items?.map((item) => item.href) ?? []),
    ]);
    expect(hrefs).not.toContain("/resources");
    expect(hrefs).not.toContain("/settings");
  });

  it("todo destino de la barra tiene su ruta en App.tsx", () => {
    const routes = new Set([...appSource.matchAll(/<Route path="([^"]+)"/g)].map((m) => m[1]));
    const hrefs = SECTIONS.flatMap((section) => [
      ...(section.href ? [section.href] : []),
      ...(section.items?.map((item) => item.href) ?? []),
    ]);
    expect(hrefs.filter((href) => !routes.has(href))).toEqual([]);
  });

  it("una pantalla de detalle enciende su menú y su destino", () => {
    const sections = buildSections("/bom/12", true);
    const catalogs = sections.find((section) => section.label === "Catálogos")!;
    expect(catalogs.active).toBe(true);
    expect(catalogs.items!.find((item) => item.label === "Materiales")!.active).toBe(true);
    expect(sections.find((section) => section.label === "Administración")!.active).toBe(false);
  });

  it("un prefijo parecido no enciende otra sección (/bomb no es /bom)", () => {
    const catalogs = buildSections("/bomb", true).find((s) => s.label === "Catálogos")!;
    expect(catalogs.active).toBe(false);
  });
});

describe("menú móvil", () => {
  it("navega al destino elegido y se cierra", () => {
    const location = memoryLocation({ path: "/dashboard", record: true });
    render(
      <Router hook={location.hook}>
        <RymelUIProvider linkComponent={({ href, ...props }) => <Link href={href} {...props} />}>
          <Navbar
            brand={{ name: "Rymel Admin" }}
            sections={buildSections("/dashboard", true)}
            user={{ name: "admin", email: "admin@rymel.com" }}
          />
        </RymelUIProvider>
      </Router>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Abrir menú" }));
    const close = screen.getByRole("button", { name: "Cerrar menú" });
    const mobileMenu = close.closest("div.fixed") as HTMLElement;
    fireEvent.click(within(mobileMenu).getByRole("link", { name: "Fantasmas" }));

    expect(location.history.at(-1)).toBe("/phantom-items");
    expect(screen.queryByRole("button", { name: "Cerrar menú" })).toBeNull();
  });
});
