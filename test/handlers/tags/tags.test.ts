// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from "../../../src/app";
import { tagStore } from "../../../src/store/tagStore";

/**
 * タグ作成APIを呼び出すヘルパー関数
 * @param body - リクエストボディ
 * @returns レスポンスオブジェクト
 */
const postTag = async (body: Record<string, unknown>) => {
  return app.request("/api/tags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
};

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

  it("タグが空のときは空配列を返すんやで", async () => {
    const res = await app.request("/api/tags");
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body).toEqual({ tags: [] });
  });

  it("登録したタグが全部取得できるんやで", async () => {
    await tagStore.create({ name: "マグロ" });
    await tagStore.create({ name: "サーモン", color: "#ff0000" });

    const res = await app.request("/api/tags");
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.tags).toHaveLength(2);
    expect(body.tags[0].name).toEqual("マグロ");
    expect(body.tags[0].color).toEqual("#6b7280");
    expect(body.tags[1].name).toEqual("サーモン");
    expect(body.tags[1].color).toEqual("#ff0000");
  });
});

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

  it("名前だけでタグが作成できるんやで", async () => {
    const res = await postTag({ name: "エビ" });
    const body = await res.json();

    expect(res.status).toEqual(201);
    expect(body.tag.name).toEqual("エビ");
    expect(body.tag.color).toEqual("#6b7280");
    expect(body.tag.id).toBeDefined();
    expect(body.tag.createdAt).toBeDefined();
  });

  it("色を指定してタグが作成できるんやで", async () => {
    const res = await postTag({ name: "イカ", color: "#ff5733" });
    const body = await res.json();

    expect(res.status).toEqual(201);
    expect(body.tag.name).toEqual("イカ");
    expect(body.tag.color).toEqual("#ff5733");
  });

  it("名前がないと400になるっちゅうねん", async () => {
    const res = await postTag({});
    const body = await res.json();

    expect(res.status).toEqual(400);
    expect(body.error).toEqual("Name is required");
  });

  it("名前が空文字やと400になるんやで", async () => {
    const res = await postTag({ name: "" });
    const body = await res.json();

    expect(res.status).toEqual(400);
    expect(body.error).toEqual("Name is required");
  });

  it("サロゲートペア文字の森鷗外もタグ名にできるんやで", async () => {
    const res = await postTag({ name: "森鷗外" });
    const body = await res.json();

    expect(res.status).toEqual(201);
    expect(body.tag.name).toEqual("森鷗外");
  });

  it("特殊文字を含むタグ名でも作成できるんやで", async () => {
    const res = await postTag({ name: "<script>alert('xss')</script>" });
    const body = await res.json();

    expect(res.status).toEqual(201);
    expect(body.tag.name).toEqual("<script>alert('xss')</script>");
  });

  it("特殊文字を含む色コードでも作成できるんやで", async () => {
    const res = await postTag({ name: "タマゴ", color: "rgb(255,0,0)" });
    const body = await res.json();

    expect(res.status).toEqual(201);
    expect(body.tag.color).toEqual("rgb(255,0,0)");
  });
});

describe("DELETE /api/tags/:id", () => {
  beforeAll(() => {
    console.log("[START] DELETE /api/tags/:id");
  });

  afterAll(() => {
    console.log("[END] DELETE /api/tags/:id");
  });

  beforeEach(async () => {
    await tagStore.reset();
  });

  it("タグを削除できるんやで", async () => {
    const tag = await tagStore.create({ name: "ウニ" });

    const res = await app.request(`/api/tags/${tag.id}`, {
      method: "DELETE",
    });
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.message).toEqual("Tag deleted");

    const listRes = await app.request("/api/tags");
    const listBody = await listRes.json();
    expect(listBody.tags).toHaveLength(0);
  });

  it("存在しないIDやったら404返すねん", async () => {
    const res = await app.request(
      "/api/tags/00000000-0000-0000-0000-000000000000",
      { method: "DELETE" },
    );
    const body = await res.json();

    expect(res.status).toEqual(404);
    expect(body.error).toEqual("Tag not found");
  });
});
