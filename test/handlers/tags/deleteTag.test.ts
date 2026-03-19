// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from "../../../src/app";
import { tagStore } from "../../../src/store/tagStore";

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

  it("タグが正しく削除されるんやで", async () => {
    const tag = await tagStore.create({ name: "マグロ", color: "#ff0000" });

    const res = await app.request(`/api/tags/${tag.id}`, {
      method: "DELETE",
    });
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.message).toEqual("Tag deleted");

    const getRes = await app.request("/api/tags");
    const getBody = await getRes.json();
    expect(getBody.tags.length).toEqual(0);
  });

  it("存在しないIDやったら404返すねん", async () => {
    const res = await app.request(
      "/api/tags/00000000-0000-0000-0000-000000000000",
      {
        method: "DELETE",
      }
    );
    const body = await res.json();

    expect(res.status).toEqual(404);
    expect(body.error).toEqual("Tag not found");
  });

  it("削除済みのタグをもう一回削除しようとしたら404返すねん", async () => {
    const tag = await tagStore.create({ name: "ウニ", color: "#ffaa00" });

    await app.request(`/api/tags/${tag.id}`, { method: "DELETE" });

    const res = await app.request(`/api/tags/${tag.id}`, {
      method: "DELETE",
    });
    const body = await res.json();

    expect(res.status).toEqual(404);
    expect(body.error).toEqual("Tag not found");
  });

  it("複数タグがあっても指定したタグだけ削除されるんやで", async () => {
    const tag1 = await tagStore.create({ name: "エビ", color: "#ff3333" });
    await tagStore.create({ name: "イカ", color: "#cccccc" });

    const res = await app.request(`/api/tags/${tag1.id}`, {
      method: "DELETE",
    });
    expect(res.status).toEqual(200);

    const getRes = await app.request("/api/tags");
    const getBody = await getRes.json();
    expect(getBody.tags.length).toEqual(1);
    expect(getBody.tags[0].name).toEqual("イカ");
  });

  it("サロゲートペア文字（森鷗外）を含むタグも削除できるんやで", async () => {
    const tag = await tagStore.create({ name: "森鷗外", color: "#000000" });

    const res = await app.request(`/api/tags/${tag.id}`, {
      method: "DELETE",
    });
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.message).toEqual("Tag deleted");
  });
});
