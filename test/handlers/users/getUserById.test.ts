// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from "../../../src/app";
import { userStore } from "../../../src/store/userStore";
import { taskStore } from "../../../src/store/taskStore";

describe("GET /api/users/:id", () => {
  beforeAll(() => {
    console.log("[START] GET /api/users/:id");
  });

  afterAll(() => {
    console.log("[END] GET /api/users/:id");
  });

  beforeEach(async () => {
    await taskStore.reset();
    await userStore.reset();
  });

  it("IDを指定してユーザーを取得できるんやで", async () => {
    const created = await userStore.create({ name: "エビ次郎", email: "ebi@sushi.com" });

    const res = await app.request(`/api/users/${created.id}`);
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.user).toEqual(
      expect.objectContaining({
        id: created.id,
        name: "エビ次郎",
        email: "ebi@sushi.com",
      })
    );
  });

  it("存在しないIDやったら404返すねん", async () => {
    const res = await app.request("/api/users/00000000-0000-0000-0000-000000000000");
    const body = await res.json();

    expect(res.status).toEqual(404);
    expect(body.error).toEqual("User not found");
  });

  it("サロゲートペア文字（森鷗外）のユーザーもIDで取得できるで", async () => {
    const created = await userStore.create({ name: "森鷗外", email: "ogai@sushi.com" });

    const res = await app.request(`/api/users/${created.id}`);
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.user.name).toEqual("森鷗外");
  });
});
