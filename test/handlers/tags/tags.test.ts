import app from "../../../src/app";
import { commentStore } from "../../../src/store/commentStore";
import { tagStore } from "../../../src/store/tagStore";
import { milestoneStore } from "../../../src/store/milestoneStore";
import { taskStore } from "../../../src/store/taskStore";
import { projectStore } from "../../../src/store/projectStore";
import { userStore } from "../../../src/store/userStore";
import type { Tag } from "../../../src/types/tag";

const createTag = async (name: string, color?: string) => {
  const body: Record<string, string> = { name };
  if (color) {
    body.color = color;
  }
  const res = await app.request("/api/tags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res;
};

beforeEach(async () => {
  await commentStore.reset();
  await tagStore.reset();
  await milestoneStore.reset();
  await taskStore.reset();
  await projectStore.reset();
  await userStore.reset();
});

describe("POST /api/tags", () => {
  it("正常系: タグを作成できる", async () => {
    const res = await createTag("バグ");

    expect(res.status).toEqual(201);
    const json = (await res.json()) as { tag: Tag };
    expect(json.tag.name).toEqual("バグ");
    expect(json.tag.id).toBeDefined();
    expect(json.tag.createdAt).toBeDefined();
  });

  it("正常系: カスタムカラーを指定してタグを作成できる", async () => {
    const res = await createTag("機能", "#ff0000");

    expect(res.status).toEqual(201);
    const json = (await res.json()) as { tag: Tag };
    expect(json.tag.name).toEqual("機能");
    expect(json.tag.color).toEqual("#ff0000");
  });

  it("正常系: カラー未指定時にデフォルトカラーが適用される", async () => {
    const res = await createTag("改善");

    expect(res.status).toEqual(201);
    const json = (await res.json()) as { tag: Tag };
    expect(json.tag.color).toEqual("#6b7280");
  });

  it("異常系: name未指定で400エラーになる", async () => {
    const res = await app.request("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(res.status).toEqual(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Name is required");
  });
});

describe("GET /api/tags", () => {
  it("正常系: タグが存在しない場合は空配列を返す", async () => {
    const res = await app.request("/api/tags");

    expect(res.status).toEqual(200);
    const json = (await res.json()) as { tags: Tag[] };
    expect(json.tags).toEqual([]);
  });

  it("正常系: 作成済みのタグ一覧を返す", async () => {
    await createTag("バグ", "#ff0000");
    await createTag("機能", "#00ff00");

    const res = await app.request("/api/tags");

    expect(res.status).toEqual(200);
    const json = (await res.json()) as { tags: Tag[] };
    expect(json.tags.length).toEqual(2);

    const names = json.tags.map((t) => t.name).sort();
    expect(names).toEqual(["バグ", "機能"]);
  });
});

describe("DELETE /api/tags/:id", () => {
  it("正常系: タグを削除できる", async () => {
    const createRes = await createTag("削除対象");
    const createJson = (await createRes.json()) as { tag: Tag };
    const tagId = createJson.tag.id;

    const res = await app.request(`/api/tags/${tagId}`, {
      method: "DELETE",
    });

    expect(res.status).toEqual(200);
    const json = (await res.json()) as { message: string };
    expect(json.message).toEqual("Tag deleted");

    const listRes = await app.request("/api/tags");
    const listJson = (await listRes.json()) as { tags: Tag[] };
    expect(listJson.tags.length).toEqual(0);
  });

  it("異常系: 存在しないタグIDで404エラーになる", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000";
    const res = await app.request(`/api/tags/${nonExistentId}`, {
      method: "DELETE",
    });

    expect(res.status).toEqual(404);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Tag not found");
  });
});
