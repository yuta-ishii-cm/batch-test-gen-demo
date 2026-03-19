// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from "../../src/app";
import { tagStore } from "../../src/store/tagStore";

beforeEach(async () => {
  await tagStore.reset();
});

describe("GET /api/tags", () => {
  beforeAll(() => {
    console.log("[START] GET /api/tags");
  });

  afterAll(() => {
    console.log("[END] GET /api/tags");
  });

  it("タグがない場合は空配列返すねん", async () => {
    const res = await app.request("/api/tags");

    expect(res.status).toEqual(200);
    const json = await res.json();
    expect(json.tags).toEqual([]);
  });

  it("タグ一覧が取得できるんやで", async () => {
    await Promise.all([
      tagStore.create({ name: "マグロ" }),
      tagStore.create({ name: "サーモン" }),
    ]);

    const res = await app.request("/api/tags");

    expect(res.status).toEqual(200);
    const json = await res.json();
    expect(json.tags.length).toEqual(2);
  });

  it("タグのフィールドが正しく返されるんやで", async () => {
    await tagStore.create({ name: "エビ", color: "#3b82f6" });

    const res = await app.request("/api/tags");

    expect(res.status).toEqual(200);
    const json = await res.json();
    const tag = json.tags[0];
    expect(tag.name).toEqual("エビ");
    expect(tag.color).toEqual("#3b82f6");
    expect(tag.id).toBeTruthy();
    expect(tag.createdAt).toBeTruthy();
  });
});

describe("POST /api/tags", () => {
  beforeAll(() => {
    console.log("[START] POST /api/tags");
  });

  afterAll(() => {
    console.log("[END] POST /api/tags");
  });

  it("タグを作成できるんやで", async () => {
    const res = await app.request("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "イカ" }),
    });

    expect(res.status).toEqual(201);
    const json = await res.json();
    expect(json.tag.name).toEqual("イカ");
  });

  it("colorを指定してタグを作成できるんやで", async () => {
    const res = await app.request("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "タマゴ", color: "#3b82f6" }),
    });

    expect(res.status).toEqual(201);
    const json = await res.json();
    expect(json.tag.name).toEqual("タマゴ");
    expect(json.tag.color).toEqual("#3b82f6");
  });

  it("colorを省略するとデフォルト色が設定されるんやで", async () => {
    const res = await app.request("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "ウニ" }),
    });

    expect(res.status).toEqual(201);
    const json = await res.json();
    expect(json.tag.color).toEqual("#6b7280");
  });

  it("nameなしやったら400返すねん", async () => {
    const res = await app.request("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(res.status).toEqual(400);
    const json = await res.json();
    expect(json.error).toEqual("Name is required");
  });

  it("サロゲートペアの名前でもタグを作成できるんやで", async () => {
    const res = await app.request("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "森鷗外タグ" }),
    });

    expect(res.status).toEqual(201);
    const json = await res.json();
    expect(json.tag.name).toEqual("森鷗外タグ");
  });
});

describe("DELETE /api/tags/:id", () => {
  beforeAll(() => {
    console.log("[START] DELETE /api/tags/:id");
  });

  afterAll(() => {
    console.log("[END] DELETE /api/tags/:id");
  });

  it("タグを削除できるんやで", async () => {
    const tag = await tagStore.create({ name: "イクラ" });

    const res = await app.request(`/api/tags/${tag.id}`, {
      method: "DELETE",
    });

    expect(res.status).toEqual(200);
    const json = await res.json();
    expect(json.message).toEqual("Tag deleted");
  });

  it("削除後にタグ一覧から消えるんやで", async () => {
    const tag = await tagStore.create({ name: "アナゴ" });

    await app.request(`/api/tags/${tag.id}`, { method: "DELETE" });

    const res = await app.request("/api/tags");
    const json = await res.json();
    expect(json.tags.length).toEqual(0);
  });

  it("存在しないIDやったら404返すねん", async () => {
    const res = await app.request(
      "/api/tags/00000000-0000-0000-0000-000000000000",
      { method: "DELETE" }
    );

    expect(res.status).toEqual(404);
    const json = await res.json();
    expect(json.error).toEqual("Tag not found");
  });
});
