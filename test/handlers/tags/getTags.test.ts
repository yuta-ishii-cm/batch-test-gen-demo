// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from "../../../src/app";
import { tagStore } from "../../../src/store/tagStore";

describe("GET /api/tags", () => {
  beforeAll(() => {
    console.log("[START] GET /api/tags");
  });

  afterAll(() => {
    console.log("[END] GET /api/tags");
  });

  beforeEach(async () => {
    await tagStore.reset();
  });

  it("タグが0件のときは空配列を返すんやで", async () => {
    const res = await app.request("/api/tags");
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.tags).toEqual([]);
  });

  it("作成したタグが全部取得できるんやで", async () => {
    await tagStore.create({ name: "マグロ", color: "#ff0000" });
    await tagStore.create({ name: "サーモン", color: "#ff6600" });
    await tagStore.create({ name: "エビ", color: "#ff3333" });

    const res = await app.request("/api/tags");
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.tags.length).toEqual(3);

    const names = body.tags.map((t: { name: string }) => t.name);
    expect(names).toContain("マグロ");
    expect(names).toContain("サーモン");
    expect(names).toContain("エビ");
  });

  it("タグにはid, name, color, createdAtが含まれるんやで", async () => {
    await tagStore.create({ name: "イカ", color: "#cccccc" });

    const res = await app.request("/api/tags");
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.tags.length).toEqual(1);

    const tag = body.tags[0];
    expect(tag.id).toBeDefined();
    expect(tag.name).toEqual("イカ");
    expect(tag.color).toEqual("#cccccc");
    expect(tag.createdAt).toBeDefined();
  });

  it("サロゲートペア文字（森鷗外）を含むタグ名も取得できるんやで", async () => {
    await tagStore.create({ name: "森鷗外" });

    const res = await app.request("/api/tags");
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.tags.length).toEqual(1);
    expect(body.tags[0].name).toEqual("森鷗外");
  });
});
