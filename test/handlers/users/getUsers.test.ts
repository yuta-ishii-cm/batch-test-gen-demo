// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from "../../../src/app";
import { userStore } from "../../../src/store/userStore";
import { taskStore } from "../../../src/store/taskStore";

describe("GET /api/users", () => {
  beforeAll(() => {
    console.log("[START] GET /api/users");
  });

  afterAll(() => {
    console.log("[END] GET /api/users");
  });

  beforeEach(async () => {
    await taskStore.reset();
    await userStore.reset();
  });

  it("ユーザーがおらん時は空配列を返すねん", async () => {
    const res = await app.request("/api/users");
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.users).toEqual([]);
  });

  it("ユーザー一覧を正しく取得できるんやで", async () => {
    await userStore.create({ name: "マグロ太郎", email: "maguro@sushi.com" });
    await userStore.create({ name: "サーモン花子", email: "salmon@sushi.com" });

    const res = await app.request("/api/users");
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.users.length).toEqual(2);
    expect(body.users[0]).toEqual(
      expect.objectContaining({ name: "マグロ太郎", email: "maguro@sushi.com" })
    );
    expect(body.users[1]).toEqual(
      expect.objectContaining({ name: "サーモン花子", email: "salmon@sushi.com" })
    );
  });

  it("サロゲートペア文字（森鷗外）を含むユーザーも取得できるで", async () => {
    await userStore.create({ name: "森鷗外", email: "ogai@sushi.com" });

    const res = await app.request("/api/users");
    const body = await res.json();

    expect(res.status).toEqual(200);
    expect(body.users.length).toEqual(1);
    expect(body.users[0].name).toEqual("森鷗外");
  });
});
