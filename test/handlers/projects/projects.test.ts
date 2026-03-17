import app from "../../../src/app";
import { commentStore } from "../../../src/store/commentStore";
import { tagStore } from "../../../src/store/tagStore";
import { milestoneStore } from "../../../src/store/milestoneStore";
import { taskStore } from "../../../src/store/taskStore";
import { projectStore } from "../../../src/store/projectStore";
import { userStore } from "../../../src/store/userStore";
import type { Project } from "../../../src/types/project";
import type { Task } from "../../../src/types/task";

const resetAll = async () => {
  await commentStore.reset();
  await tagStore.reset();
  await milestoneStore.reset();
  await taskStore.reset();
  await projectStore.reset();
  await userStore.reset();
};

describe("POST /api/projects", () => {
  beforeEach(async () => {
    await resetAll();
  });

  it("正常系: プロジェクトを作成できる", async () => {
    const res = await app.request("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "テストプロジェクト" }),
    });

    expect(res.status).toEqual(201);
    const json = (await res.json()) as { project: Project };
    expect(json.project.name).toEqual("テストプロジェクト");
    expect(json.project.status).toEqual("active");
    expect(json.project.id).toBeDefined();
  });

  it("正常系: 説明付きでプロジェクトを作成できる", async () => {
    const res = await app.request("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "プロジェクトA", description: "説明文です" }),
    });

    expect(res.status).toEqual(201);
    const json = (await res.json()) as { project: Project };
    expect(json.project.name).toEqual("プロジェクトA");
    expect(json.project.description).toEqual("説明文です");
  });

  it("異常系: 名前が未指定の場合400エラーを返す", async () => {
    const res = await app.request("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(res.status).toEqual(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Name is required");
  });
});

describe("GET /api/projects", () => {
  beforeEach(async () => {
    await resetAll();
  });

  it("正常系: プロジェクトが0件の場合、空配列を返す", async () => {
    const res = await app.request("/api/projects");

    expect(res.status).toEqual(200);
    const json = (await res.json()) as { projects: Project[] };
    expect(json.projects).toEqual([]);
  });

  it("正常系: プロジェクト一覧を取得できる", async () => {
    await projectStore.create({ name: "プロジェクト1" });
    await projectStore.create({ name: "プロジェクト2" });

    const res = await app.request("/api/projects");

    expect(res.status).toEqual(200);
    const json = (await res.json()) as { projects: Project[] };
    expect(json.projects.length).toEqual(2);
  });

  it("正常系: ステータスでフィルタできる", async () => {
    const created = await projectStore.create({ name: "アクティブ" });
    await projectStore.create({ name: "別プロジェクト" });
    await projectStore.update(created.id, { status: "archived" });

    const res = await app.request("/api/projects?status=archived");

    expect(res.status).toEqual(200);
    const json = (await res.json()) as { projects: Project[] };
    expect(json.projects.length).toEqual(1);
    expect(json.projects[0].name).toEqual("アクティブ");
  });
});

describe("GET /api/projects/:id", () => {
  beforeEach(async () => {
    await resetAll();
  });

  it("正常系: IDでプロジェクトを取得できる", async () => {
    const project = await projectStore.create({ name: "取得テスト" });

    const res = await app.request(`/api/projects/${project.id}`);

    expect(res.status).toEqual(200);
    const json = (await res.json()) as { project: Project };
    expect(json.project.id).toEqual(project.id);
    expect(json.project.name).toEqual("取得テスト");
  });

  it("異常系: 存在しないIDの場合404エラーを返す", async () => {
    const res = await app.request("/api/projects/00000000-0000-0000-0000-000000000000");

    expect(res.status).toEqual(404);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Project not found");
  });
});

describe("PUT /api/projects/:id", () => {
  beforeEach(async () => {
    await resetAll();
  });

  it("正常系: プロジェクトを更新できる", async () => {
    const project = await projectStore.create({ name: "更新前" });

    const res = await app.request(`/api/projects/${project.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "更新後", status: "completed" }),
    });

    expect(res.status).toEqual(200);
    const json = (await res.json()) as { project: Project };
    expect(json.project.name).toEqual("更新後");
    expect(json.project.status).toEqual("completed");
  });

  it("異常系: 存在しないIDの場合404エラーを返す", async () => {
    const res = await app.request("/api/projects/00000000-0000-0000-0000-000000000000", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "更新" }),
    });

    expect(res.status).toEqual(404);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Project not found");
  });

  it("異常系: 無効なステータスの場合400エラーを返す", async () => {
    const project = await projectStore.create({ name: "ステータステスト" });

    const res = await app.request(`/api/projects/${project.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "invalid_status" }),
    });

    expect(res.status).toEqual(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Invalid status");
  });
});

describe("DELETE /api/projects/:id", () => {
  beforeEach(async () => {
    await resetAll();
  });

  it("正常系: プロジェクトを削除できる", async () => {
    const project = await projectStore.create({ name: "削除テスト" });

    const res = await app.request(`/api/projects/${project.id}`, {
      method: "DELETE",
    });

    expect(res.status).toEqual(200);
    const json = (await res.json()) as { message: string };
    expect(json.message).toEqual("Project deleted");
  });

  it("異常系: 存在しないIDの場合404エラーを返す", async () => {
    const res = await app.request("/api/projects/00000000-0000-0000-0000-000000000000", {
      method: "DELETE",
    });

    expect(res.status).toEqual(404);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Project not found");
  });
});

describe("GET /api/projects/:id/tasks", () => {
  beforeEach(async () => {
    await resetAll();
  });

  it("正常系: プロジェクトに属するタスクを取得できる", async () => {
    const project = await projectStore.create({ name: "タスク付きプロジェクト" });
    await taskStore.create({ title: "タスク1", projectId: project.id });
    await taskStore.create({ title: "タスク2", projectId: project.id });
    await taskStore.create({ title: "別プロジェクトのタスク" });

    const res = await app.request(`/api/projects/${project.id}/tasks`);

    expect(res.status).toEqual(200);
    const json = (await res.json()) as { tasks: Task[] };
    expect(json.tasks.length).toEqual(2);
  });

  it("正常系: タスクが0件の場合、空配列を返す", async () => {
    const project = await projectStore.create({ name: "空プロジェクト" });

    const res = await app.request(`/api/projects/${project.id}/tasks`);

    expect(res.status).toEqual(200);
    const json = (await res.json()) as { tasks: Task[] };
    expect(json.tasks).toEqual([]);
  });

  it("異常系: 存在しないプロジェクトの場合404エラーを返す", async () => {
    const res = await app.request("/api/projects/00000000-0000-0000-0000-000000000000/tasks");

    expect(res.status).toEqual(404);
    const json = (await res.json()) as { error: string };
    expect(json.error).toEqual("Project not found");
  });
});
