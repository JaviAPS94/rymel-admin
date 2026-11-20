/**
 * El catálogo de semielaborados: lista, búsqueda, alta/edición y baja.
 */

/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { SemiFinishedAdminItem } from "@/types/bom.types";

const mocks = vi.hoisted(() => ({
  getAll: vi.fn(),
  getAdminList: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("@services/semiFinishedService", () => ({ semiFinishedService: mocks }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@components/Layout", () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { SemiFinishedListPage } from "./SemiFinishedListPage";

const item = (id: number, code: string, name: string, bomCount = 0): SemiFinishedAdminItem => ({
  id,
  code,
  name,
  bomCount,
  updatedAt: "2026-11-17T00:00:00.000Z",
});

const ITEMS = [
  item(1, "SE-01", "Bobina", 2),
  item(2, "SE-02", "Tanque"),
  item(3, "SE-03", "Núcleo"),
];

const conflict = (message: string) => ({ response: { status: 409, data: { message } } });

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <SemiFinishedListPage />
    </QueryClientProvider>,
  );

const codesInTable = () =>
  within(screen.getByRole("table"))
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).queryAllByRole("cell")[0]?.textContent);

beforeEach(() => {
  Object.values(mocks).forEach((mock) => mock.mockReset());
  mocks.getAdminList.mockResolvedValue(ITEMS);
});

describe("SemiFinishedListPage", () => {
  it("lista los semielaborados con su uso en estructuras", async () => {
    renderPage();

    expect(await screen.findByText("Bobina")).toBeTruthy();
    expect(screen.getByText("Total: 3 registros")).toBeTruthy();
    expect(screen.getByText("2 estructuras")).toBeTruthy();
    expect(screen.getAllByText("Sin uso")).toHaveLength(2);
  });

  it("busca por código o nombre sin distinguir mayúsculas ni tildes", async () => {
    renderPage();
    await screen.findByText("Bobina");

    fireEvent.change(screen.getByLabelText("Buscar por código o nombre"), {
      target: { value: "nucleo" },
    });
    expect(codesInTable()).toEqual(["SE-03"]);
    expect(screen.getByText("1 de 3 registros")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Buscar por código o nombre"), {
      target: { value: "se-02" },
    });
    expect(codesInTable()).toEqual(["SE-02"]);
  });

  it("pagina de 10 en 10 y la búsqueda vuelve a la página 1", async () => {
    mocks.getAdminList.mockResolvedValue(
      Array.from({ length: 12 }, (_, i) => item(i + 1, `SE-${String(i + 1).padStart(2, "0")}`, `N${i + 1}`)),
    );
    renderPage();
    await screen.findByText("N1");
    expect(codesInTable()).toHaveLength(10);

    fireEvent.click(screen.getByRole("button", { name: "2" }));
    expect(codesInTable()).toEqual(["SE-11", "SE-12"]);

    fireEvent.change(screen.getByLabelText("Buscar por código o nombre"), {
      target: { value: "SE-0" },
    });
    expect(codesInTable()).toHaveLength(9);
  });

  it("crea un semielaborado con los campos recortados", async () => {
    mocks.create.mockResolvedValue(item(4, "SE-04", "Tapa"));
    renderPage();
    await screen.findByText("Bobina");

    fireEvent.click(screen.getByRole("button", { name: /Nuevo semielaborado/ }));
    fireEvent.change(screen.getByLabelText("Código"), { target: { value: " SE-04 " } });
    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Tapa" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear" }));

    await waitFor(() => expect(mocks.create).toHaveBeenCalled());
    expect(mocks.create.mock.calls[0][0]).toEqual({ code: "SE-04", name: "Tapa" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(mocks.getAdminList).toHaveBeenCalledTimes(2);
  });

  it("no envía con campos vacíos", async () => {
    renderPage();
    await screen.findByText("Bobina");

    fireEvent.click(screen.getByRole("button", { name: /Nuevo semielaborado/ }));
    fireEvent.change(screen.getByLabelText("Código"), { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "Crear" }));

    expect(screen.getByText("El código es requerido")).toBeTruthy();
    expect(screen.getByText("El nombre es requerido")).toBeTruthy();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("muestra el código repetido en su campo y deja el modal abierto", async () => {
    mocks.update.mockRejectedValue(conflict("Ya existe un semielaborado con el código SE-01"));
    renderPage();
    await screen.findByText("Tanque");

    fireEvent.click(screen.getByRole("button", { name: "Editar SE-02" }));
    const code = screen.getByLabelText("Código") as HTMLInputElement;
    expect(code.value).toBe("SE-02");
    fireEvent.change(code, { target: { value: "SE-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Actualizar" }));

    expect(await screen.findByText("Ya existe un semielaborado con el código SE-01")).toBeTruthy();
    expect(mocks.update).toHaveBeenCalledWith(2, { code: "SE-01", name: "Tanque" });
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("elimina tras confirmar", async () => {
    mocks.remove.mockResolvedValue(undefined);
    renderPage();
    await screen.findByText("Tanque");

    fireEvent.click(screen.getByRole("button", { name: "Eliminar SE-02" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).queryByText(/Se usa en/)).toBeNull();
    fireEvent.click(within(dialog).getByRole("button", { name: "Eliminar" }));

    await waitFor(() => expect(mocks.remove).toHaveBeenCalled());
    expect(mocks.remove.mock.calls[0][0]).toBe(2);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("avisa del uso y muestra el rechazo del servidor", async () => {
    mocks.remove.mockRejectedValue(
      conflict("El semielaborado SE-01 se usa en las estructuras: PT: 1FCV, PT: 3CA"),
    );
    renderPage();
    await screen.findByText("Bobina");

    fireEvent.click(screen.getByRole("button", { name: "Eliminar SE-01" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/Se usa en 2 estructuras/)).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Eliminar" }));

    expect(
      await within(dialog).findByText(
        "El semielaborado SE-01 se usa en las estructuras: PT: 1FCV, PT: 3CA",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Bobina")).toBeTruthy();
  });
});
