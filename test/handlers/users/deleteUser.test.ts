// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from "../../../src/app";
import { userStore } from "../../../src/store/userStore";
import { taskStore } from "../../../src/store/taskStore";

describe("DELETE /api/users/:id", () => {
  beforeAll(() => {
    console.log("[START] DELETE /api/users/:id");
  });

  afterAll(() => {
    console.log("[END] DELETE /api/users/:id");
  });

  beforeEach(async () => {
    await taskStore.reset();
    await userStore.reset();
  });

  it("ユーザーを削除できるんやで", async () => {
    const created = await userStore.create({ name: "ウニ五郎", email: "uni@sushi.com" });

    const res = await app.request(`/api/users/${created.id}`, {
      method: "DELETE",
    });
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.message).toEqual("User deleted");

    const getRes = await app.request(`/api/users/${created.id}`);
    expect(getRes.status).toEqual(404);
  });

  it("存在しないIDやったら404返すねん", async () => {
    const res = await app.request("/api/users/00000000-0000-0000-0000-000000000000", {
      method: "DELETE",
    });
    const body = await res.json();

    expect(res.status).toEqual(404);
    expect(body.error).toEqual("User not found");
  });

  it("サロゲートペア文字（森鷗外）のユーザーも削除できるで", async () => {
    const created = await userStore.create({ name: "森鷗外", email: "ogai@sushi.com" });

    const res = await app.request(`/api/users/${created.id}`, {
      method: "DELETE",
    });

    expect(res.status).toEqual(200);

    const getRes = await app.request(`/api/users/${created.id}`);
    expect(getRes.status).toEqual(404);
  });
});
