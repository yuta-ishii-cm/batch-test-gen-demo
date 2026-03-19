// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from "../../../src/app";
import { userStore } from "../../../src/store/userStore";
import { taskStore } from "../../../src/store/taskStore";

describe("PUT /api/users/:id", () => {
  beforeAll(() => {
    console.log("[START] PUT /api/users/:id");
  });

  afterAll(() => {
    console.log("[END] PUT /api/users/:id");
  });

  beforeEach(async () => {
    await taskStore.reset();
    await userStore.reset();
  });

  it("ユーザーの名前を更新できるんやで", async () => {
    const created = await userStore.create({ name: "マグロ太郎", email: "maguro@sushi.com" });

    const res = await app.request(`/api/users/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "サーモン花子" }),
    });
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.user.name).toEqual("サーモン花子");
    expect(body.user.email).toEqual("maguro@sushi.com");
  });

  it("ユーザーのメールを更新できるんやで", async () => {
    const created = await userStore.create({ name: "エビ次郎", email: "ebi@sushi.com" });

    const res = await app.request(`/api/users/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "ebi-new@sushi.com" }),
    });
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.user.email).toEqual("ebi-new@sushi.com");
  });

  it("存在しないIDやったら404返すねん", async () => {
    const res = await app.request("/api/users/00000000-0000-0000-0000-000000000000", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "イカ三郎" }),
    });
    const body = await res.json();

    expect(res.status).toEqual(404);
    expect(body.error).toEqual("User not found");
  });

  it("サロゲートペア文字（森鷗外）の名前に更新できるで", async () => {
    const created = await userStore.create({ name: "タマゴ四郎", email: "tamago@sushi.com" });

    const res = await app.request(`/api/users/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "森鷗外" }),
    });
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.user.name).toEqual("森鷗外");
  });
});
