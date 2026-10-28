import { beforeEach, describe, expect, it, vi } from "vitest";

const post = vi.hoisted(() => vi.fn());
vi.mock("./api", () => ({ apiClient: { post } }));

import { IMPORT_TIMEOUT_MS, phantomItemService } from "./phantomItemService";

beforeEach(() => {
  post.mockReset().mockResolvedValue({ data: {} });
});

/**
 * Regression: the client's general timeout is 10 s and importing the whole
 * workbook takes about 13 s. The screen reported a failure while the server
 * kept writing.
 */
describe("phantomItemService: long imports", () => {
  it("gives the workbook import more than the general timeout", async () => {
    await phantomItemService.importPhantomItems(new Blob() as File, "create", false);

    expect(post.mock.calls[0][2]).toMatchObject({ timeout: IMPORT_TIMEOUT_MS });
    expect(IMPORT_TIMEOUT_MS).toBeGreaterThan(13_000 * 10);
  });

  it("and the paste, which can be a whole sheet", async () => {
    await phantomItemService.importPasted(3, "a\tb", "create", true);

    expect(post.mock.calls[0][2]).toMatchObject({ timeout: IMPORT_TIMEOUT_MS });
  });
});
