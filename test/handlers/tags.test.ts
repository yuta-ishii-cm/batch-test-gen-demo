// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from "../../src/app";
import { tagStore } from "../../src/store/tagStore";

describe("Tags Handlers", () => {
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

    it("作成したタグが一覧に含まれてるんやで", async () => {
      await tagStore.create({ name: "バグ" });
      await tagStore.create({ name: "機能追加" });

      const res = await app.request("/api/tags");
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.tags.length).toEqual(2);
      expect(body.tags.map((t: { name: string }) => t.name)).toEqual(
        expect.arrayContaining(["バグ", "機能追加"])
      );
    });
  });

  describe("POST /api/tags", () => {
    it("タグが正しく作成されるんやで", async () => {
      const res = await app.request("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "緊急" }),
      });
      const body = await res.json();

      expect(res.status).toEqual(201);
      expect(body.tag.name).toEqual("緊急");
      expect(body.tag.id).toBeDefined();
      expect(body.tag.color).toEqual("#6b7280");
      expect(body.tag.createdAt).toBeDefined();
    });

    it("colorを指定してタグを作成できるんやで", async () => {
      const res = await app.request("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "重要", color: "#ff0000" }),
      });
      const body = await res.json();

      expect(res.status).toEqual(201);
      expect(body.tag.name).toEqual("重要");
      expect(body.tag.color).toEqual("#ff0000");
    });

    it("名前がなかったら400返すねん", async () => {
      const res = await app.request("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const body = await res.json();

      expect(res.status).toEqual(400);
      expect(body).toEqual({ error: "Name is required" });
    });
  });

  describe("DELETE /api/tags/:id", () => {
    it("タグが正しく削除されるんやで", async () => {
      const tag = await tagStore.create({ name: "不要タグ" });

      const res = await app.request(`/api/tags/${tag.id}`, {
        method: "DELETE",
      });
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body).toEqual({ message: "Tag deleted" });

      const listRes = await app.request("/api/tags");
      const listBody = await listRes.json();
      expect(listBody.tags.length).toEqual(0);
    });

    it("存在せんタグを消そうとしたら404返すねん", async () => {
      const res = await app.request(
        "/api/tags/00000000-0000-0000-0000-000000000000",
        { method: "DELETE" }
      );
      const body = await res.json();

      expect(res.status).toEqual(404);
      expect(body).toEqual({ error: "Tag not found" });
    });
  });

  describe("境界値テスト", () => {
    it("森鷗外みたいな特殊文字のタグ名でも作成できるんやで", async () => {
      const res = await app.request("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "森鷗外" }),
      });
      const body = await res.json();

      expect(res.status).toEqual(201);
      expect(body.tag.name).toEqual("森鷗外");
    });

    it("空文字のタグ名やったら400返すんやで", async () => {
      const res = await app.request("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "" }),
      });
      const body = await res.json();

      expect(res.status).toEqual(400);
      expect(body).toEqual({ error: "Name is required" });
    });
  });
});
