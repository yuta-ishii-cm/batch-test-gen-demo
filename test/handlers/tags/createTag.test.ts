// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from "../../../src/app";
import { tagStore } from "../../../src/store/tagStore";

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

describe("POST /api/tags", () => {
  beforeAll(() => {
    console.log("[START] POST /api/tags");
  });

  afterAll(() => {
    console.log("[END] POST /api/tags");
  });

  beforeEach(async () => {
    await tagStore.reset();
  });

  it("タグが正しく作成されるんやで", async () => {
    const res = await app.request("/api/tags", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ name: "マグロ", color: "#ff0000" }),
    });
    const body = await res.json();

    expect(res.status).toEqual(201);
    expect(body.tag.name).toEqual("マグロ");
    expect(body.tag.color).toEqual("#ff0000");
    expect(body.tag.id).toBeDefined();
    expect(body.tag.createdAt).toBeDefined();
  });

  it("colorを省略したらデフォルト色で作成されるんやで", async () => {
    const res = await app.request("/api/tags", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ name: "サーモン" }),
    });
    const body = await res.json();

    expect(res.status).toEqual(201);
    expect(body.tag.name).toEqual("サーモン");
    expect(body.tag.color).toEqual("#6b7280");
  });

  it("nameが空やったら400返すねん", async () => {
    const res = await app.request("/api/tags", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ name: "" }),
    });
    const body = await res.json();

    expect(res.status).toEqual(400);
    expect(body.error).toBeDefined();
  });

  it("nameがなかったら400返すねん", async () => {
    const res = await app.request("/api/tags", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ color: "#ff0000" }),
    });
    const body = await res.json();

    expect(res.status).toEqual(400);
    expect(body.error).toBeDefined();
  });

  it("サロゲートペア文字（森鷗外）を含む名前でもタグ作成できるんやで", async () => {
    const res = await app.request("/api/tags", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ name: "森鷗外", color: "#000000" }),
    });
    const body = await res.json();

    expect(res.status).toEqual(201);
    expect(body.tag.name).toEqual("森鷗外");
  });

  it("作成したタグがGETで取得できるんやで", async () => {
    await app.request("/api/tags", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ name: "タマゴ", color: "#ffff00" }),
    });

    const res = await app.request("/api/tags");
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.tags.length).toEqual(1);
    expect(body.tags[0].name).toEqual("タマゴ");
  });
});
