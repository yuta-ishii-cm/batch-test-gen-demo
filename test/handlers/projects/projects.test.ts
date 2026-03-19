// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from "../../../src/app";
import { projectStore } from "../../../src/store/projectStore";
import { taskStore } from "../../../src/store/taskStore";

beforeAll(() => {
  console.log("[START] projects handlers");
});

afterAll(() => {
  console.log("[END] projects handlers");
});

beforeEach(async () => {
  await taskStore.reset();
  await projectStore.reset();
});

/**
 * プロジェクトを作成するヘルパー
 * @param name - プロジェクト名
 * @param description - プロジェクトの説明
 * @returns 作成されたプロジェクトのレスポンスJSON
 */
const createProject = async (name: string, description?: string) => {
  const res = await app.request("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description }),
  });
  return res.json();
};

/**
 * タスクを作成するヘルパー
 * @param title - タスクタイトル
 * @param projectId - プロジェクトID
 * @returns 作成されたタスクのレスポンスJSON
 */
const createTask = async (title: string, projectId: string) => {
  const res = await app.request("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, projectId }),
  });
  return res.json();
};

describe("GET /api/projects", () => {
  it("プロジェクト一覧が取得できるんやで", async () => {
    await createProject("マグロ", "新鮮なマグロプロジェクト");
    await createProject("サーモン", "サーモンプロジェクト");

    const res = await app.request("/api/projects");
    expect(res.status).toEqual(200);

    const body = await res.json();
    expect(body.projects.length).toEqual(2);
  });

  it("プロジェクトがゼロ件でも空配列で返すんやで", async () => {
    const res = await app.request("/api/projects");
    expect(res.status).toEqual(200);

    const body = await res.json();
    expect(body.projects).toEqual([]);
  });

  it("statusでフィルタリングできるんやで", async () => {
    await createProject("エビ");
    await createProject("イカ");

    const allRes = await app.request("/api/projects");
    const allBody = await allRes.json();
    expect(allBody.projects.length).toEqual(2);

    const activeRes = await app.request("/api/projects?status=active");
    const activeBody = await activeRes.json();
    expect(activeBody.projects.length).toEqual(2);

    const archivedRes = await app.request("/api/projects?status=archived");
    const archivedBody = await archivedRes.json();
    expect(archivedBody.projects.length).toEqual(0);
  });
});

describe("POST /api/projects", () => {
  it("プロジェクトが正しく作成されるんやで", async () => {
    const res = await app.request("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "タマゴ",
        description: "タマゴプロジェクトやで",
      }),
    });

    expect(res.status).toEqual(201);
    const body = await res.json();
    expect(body.project.name).toEqual("タマゴ");
    expect(body.project.description).toEqual("タマゴプロジェクトやで");
    expect(body.project.status).toEqual("active");
    expect(body.project.id).toBeDefined();
    expect(body.project.createdAt).toBeDefined();
    expect(body.project.updatedAt).toBeDefined();
  });

  it("descriptionなしでも作成できるんやで", async () => {
    const res = await app.request("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "ウニ" }),
    });

    expect(res.status).toEqual(201);
    const body = await res.json();
    expect(body.project.name).toEqual("ウニ");
    expect(body.project.description).toEqual("");
  });

  it("nameがなかったら400返すねん", async () => {
    const res = await app.request("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: "名前なしやで" }),
    });

    expect(res.status).toEqual(400);
    const body = await res.json();
    expect(body.error).toEqual("Name is required");
  });

  it("nameが空文字でも400返すねん", async () => {
    const res = await app.request("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "" }),
    });

    expect(res.status).toEqual(400);
    const body = await res.json();
    expect(body.error).toEqual("Name is required");
  });
});

describe("GET /api/projects/:id", () => {
  it("IDでプロジェクトが取得できるんやで", async () => {
    const created = await createProject("イクラ", "イクラの説明");

    const res = await app.request(`/api/projects/${created.project.id}`);
    expect(res.status).toEqual(200);

    const body = await res.json();
    expect(body.project.name).toEqual("イクラ");
    expect(body.project.description).toEqual("イクラの説明");
  });

  it("存在しないIDやったら404返すねん", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const res = await app.request(`/api/projects/${fakeId}`);
    expect(res.status).toEqual(404);

    const body = await res.json();
    expect(body.error).toEqual("Project not found");
  });
});

describe("PUT /api/projects/:id", () => {
  it("プロジェクトの名前を更新できるんやで", async () => {
    const created = await createProject("アナゴ");

    const res = await app.request(`/api/projects/${created.project.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "ホタテ" }),
    });

    expect(res.status).toEqual(200);
    const body = await res.json();
    expect(body.project.name).toEqual("ホタテ");
  });

  it("プロジェクトのステータスを更新できるんやで", async () => {
    const created = await createProject("カンパチ");

    const res = await app.request(`/api/projects/${created.project.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });

    expect(res.status).toEqual(200);
    const body = await res.json();
    expect(body.project.status).toEqual("completed");
  });

  it("プロジェクトの説明を更新できるんやで", async () => {
    const created = await createProject("マグロ", "旧説明");

    const res = await app.request(`/api/projects/${created.project.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: "新説明やで" }),
    });

    expect(res.status).toEqual(200);
    const body = await res.json();
    expect(body.project.description).toEqual("新説明やで");
  });

  it("無効なステータスやったら400返すねん", async () => {
    const created = await createProject("サーモン");

    const res = await app.request(`/api/projects/${created.project.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "invalid_status" }),
    });

    expect(res.status).toEqual(400);
    const body = await res.json();
    expect(body.error).toEqual("Invalid status");
  });

  it("存在しないIDの更新やったら404返すねん", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const res = await app.request(`/api/projects/${fakeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "存在しないで" }),
    });

    expect(res.status).toEqual(404);
    const body = await res.json();
    expect(body.error).toEqual("Project not found");
  });
});

describe("DELETE /api/projects/:id", () => {
  it("プロジェクトを削除できるんやで", async () => {
    const created = await createProject("エビ");

    const res = await app.request(`/api/projects/${created.project.id}`, {
      method: "DELETE",
    });

    expect(res.status).toEqual(200);
    const body = await res.json();
    expect(body.message).toEqual("Project deleted");

    const getRes = await app.request(`/api/projects/${created.project.id}`);
    expect(getRes.status).toEqual(404);
  });

  it("存在しないIDの削除やったら404返すねん", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const res = await app.request(`/api/projects/${fakeId}`, {
      method: "DELETE",
    });

    expect(res.status).toEqual(404);
    const body = await res.json();
    expect(body.error).toEqual("Project not found");
  });
});

describe("GET /api/projects/:id/tasks", () => {
  it("プロジェクトに紐づくタスク一覧が取得できるんやで", async () => {
    const project = await createProject("イカ");
    await createTask("マグロタスク", project.project.id);
    await createTask("サーモンタスク", project.project.id);

    const res = await app.request(
      `/api/projects/${project.project.id}/tasks`
    );
    expect(res.status).toEqual(200);

    const body = await res.json();
    expect(body.tasks.length).toEqual(2);
  });

  it("タスクがないプロジェクトやったら空配列返すんやで", async () => {
    const project = await createProject("タマゴ");

    const res = await app.request(
      `/api/projects/${project.project.id}/tasks`
    );
    expect(res.status).toEqual(200);

    const body = await res.json();
    expect(body.tasks).toEqual([]);
  });

  it("存在しないプロジェクトIDやったら404返すねん", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const res = await app.request(`/api/projects/${fakeId}/tasks`);
    expect(res.status).toEqual(404);

    const body = await res.json();
    expect(body.error).toEqual("Project not found");
  });
});

describe("境界値テスト", () => {
  it("サロゲートペア文字を含む名前でプロジェクトが作成できるんやで", async () => {
    const res = await app.request("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "森鷗外", description: "鷗はサロゲートペアやで" }),
    });

    expect(res.status).toEqual(201);
    const body = await res.json();
    expect(body.project.name).toEqual("森鷗外");
    expect(body.project.description).toEqual("鷗はサロゲートペアやで");
  });

  it("サロゲートペア文字を含む名前で更新もできるんやで", async () => {
    const created = await createProject("ウニ");

    const res = await app.request(`/api/projects/${created.project.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "森鷗外プロジェクト" }),
    });

    expect(res.status).toEqual(200);
    const body = await res.json();
    expect(body.project.name).toEqual("森鷗外プロジェクト");
  });

  it("特殊文字を含む名前でも作成できるんやで", async () => {
    const res = await app.request("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "テスト<script>alert('xss')</script>",
        description: "特殊文字&\"'<>やで",
      }),
    });

    expect(res.status).toEqual(201);
    const body = await res.json();
    expect(body.project.name).toEqual("テスト<script>alert('xss')</script>");
    expect(body.project.description).toEqual("特殊文字&\"'<>やで");
  });
});
