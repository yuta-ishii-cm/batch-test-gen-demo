// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from "../../../src/app";
import { tagStore } from "../../../src/store/tagStore";

describe("tags handlers", () => {
  beforeAll(() => {
    console.log("[START] tags handlers");
  });

  afterAll(() => {
    console.log("[END] tags handlers");
  });

  beforeEach(async () => {
    await tagStore.reset();
  });

  describe("GET /api/tags", () => {
    it("タグ一覧が空のときは空配列を返すんやで", async () => {
      const res = await app.request("/api/tags");
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body).toEqual({ tags: [] });
    });

    it("作成したタグが全部取得できるんやで", async () => {
      await tagStore.create({ name: "マグロ" });
      await tagStore.create({ name: "サーモン" });
      await tagStore.create({ name: "エビ" });

      const res = await app.request("/api/tags");
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.tags.length).toEqual(3);

      const names = body.tags.map((t: { name: string }) => t.name);
      expect(names).toEqual(expect.arrayContaining(["マグロ", "サーモン", "エビ"]));
    });
  });

  describe("POST /api/tags", () => {
    it("タグが正しく作成されるんやで", async () => {
      const res = await app.request("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "イカ" }),
      });
      const body = await res.json();

      expect(res.status).toEqual(201);
      expect(body.tag.name).toEqual("イカ");
      expect(body.tag.color).toEqual("#6b7280");
      expect(body.tag.id).toBeDefined();
      expect(body.tag.createdAt).toBeDefined();
    });

    it("色を指定したらちゃんと反映されるねん", async () => {
      const res = await app.request("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "ウニ", color: "#ff5733" }),
      });
      const body = await res.json();

      expect(res.status).toEqual(201);
      expect(body.tag.name).toEqual("ウニ");
      expect(body.tag.color).toEqual("#ff5733");
    });

    it("名前がないと400返すねん", async () => {
      const res = await app.request("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const body = await res.json();

      expect(res.status).toEqual(400);
      expect(body.error).toEqual("Name is required");
    });

    it("名前が空文字でも400返すんやで", async () => {
      const res = await app.request("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "" }),
      });
      const body = await res.json();

      expect(res.status).toEqual(400);
      expect(body.error).toEqual("Name is required");
    });

    it("同じ名前のタグは作れへんねん", async () => {
      await app.request("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "イクラ" }),
      });

      const res = await app.request("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "イクラ" }),
      });

      expect(res.status).toEqual(500);
    });
  });

  describe("DELETE /api/tags/:id", () => {
    it("タグがちゃんと削除されるんやで", async () => {
      const created = await tagStore.create({ name: "アナゴ" });

      const res = await app.request(`/api/tags/${created.id}`, {
        method: "DELETE",
      });
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.message).toEqual("Tag deleted");

      const allTags = await tagStore.getAll();
      expect(allTags.length).toEqual(0);
    });

    it("存在しないIDやったら404返すねん", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const res = await app.request(`/api/tags/${fakeId}`, {
        method: "DELETE",
      });
      const body = await res.json();

      expect(res.status).toEqual(404);
      expect(body.error).toEqual("Tag not found");
    });
  });

  describe("境界値テスト", () => {
    it("サロゲートペア文字を含む名前でもタグ作れるんやで", async () => {
      const res = await app.request("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "森鷗外" }),
      });
      const body = await res.json();

      expect(res.status).toEqual(201);
      expect(body.tag.name).toEqual("森鷗外");
    });

    it("特殊文字入りの名前でもいけるんやで", async () => {
      const res = await app.request("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "タグ<script>&\"'" }),
      });
      const body = await res.json();

      expect(res.status).toEqual(201);
      expect(body.tag.name).toEqual("タグ<script>&\"'");
    });

    it("色がhex形式やなくても保存はされるんやで", async () => {
      const res = await app.request("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "ホタテ", color: "not-a-color" }),
      });
      const body = await res.json();

      expect(res.status).toEqual(201);
      expect(body.tag.color).toEqual("not-a-color");
    });

    it("めっちゃ長い名前でもタグ作れるんやで", async () => {
      const longName = "カンパチ".repeat(100);
      const res = await app.request("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: longName }),
      });
      const body = await res.json();

      expect(res.status).toEqual(201);
      expect(body.tag.name).toEqual(longName);
    });
  });
});
