// [review-test-pattern] 正常系:✅ 異常系:✅ 境界値:✅
import app from "../../src/app";
import { milestoneStore } from "../../src/store/milestoneStore";
import { projectStore } from "../../src/store/projectStore";

/**
 * テスト用のプロジェクトを作成するヘルパー
 * @param name - プロジェクト名
 * @returns 作成されたプロジェクト
 */
const createTestProject = async (name = "テストプロジェクト") => {
  const res = await app.request("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  return data.project;
};

/**
 * テスト用のマイルストーンを作成するヘルパー
 * @param projectId - プロジェクトID
 * @param title - マイルストーンタイトル
 * @returns 作成されたマイルストーン
 */
const createTestMilestone = async (projectId: string, title = "テストマイルストーン") => {
  const res = await app.request(`/api/projects/${projectId}/milestones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  const data = await res.json();
  return data.milestone;
};

describe("Milestones Handlers", () => {
  beforeEach(async () => {
    await milestoneStore.reset();
    await projectStore.reset();
  });

  describe("GET /api/projects/:projectId/milestones", () => {
    it("プロジェクトのマイルストーン一覧が取得できるんやで", async () => {
      const project = await createTestProject();
      await createTestMilestone(project.id, "v1.0リリース");
      await createTestMilestone(project.id, "v2.0リリース");

      const res = await app.request(`/api/projects/${project.id}/milestones`);
      const data = await res.json();

      expect(res.status).toEqual(200);
      expect(data.milestones.length).toEqual(2);
    });

    it("マイルストーンがないプロジェクトやったら空配列返すねん", async () => {
      const project = await createTestProject();

      const res = await app.request(`/api/projects/${project.id}/milestones`);
      const data = await res.json();

      expect(res.status).toEqual(200);
      expect(data.milestones).toEqual([]);
    });

    it("プロジェクトが存在せんかったら404返すねん", async () => {
      const res = await app.request("/api/projects/nonexistent-id/milestones");
      const data = await res.json();

      expect(res.status).toEqual(404);
      expect(data.error).toEqual("Project not found");
    });
  });

  describe("GET /api/projects/:projectId/milestones/:milestoneId", () => {
    it("IDでマイルストーンが取得できるんやで", async () => {
      const project = await createTestProject();
      const milestone = await createTestMilestone(project.id, "v1.0リリース");

      const res = await app.request(
        `/api/projects/${project.id}/milestones/${milestone.id}`
      );
      const data = await res.json();

      expect(res.status).toEqual(200);
      expect(data.milestone.title).toEqual("v1.0リリース");
      expect(data.milestone.projectId).toEqual(project.id);
    });

    it("存在せんマイルストーンIDやったら404返すねん", async () => {
      const project = await createTestProject();

      const res = await app.request(
        `/api/projects/${project.id}/milestones/nonexistent-id`
      );
      const data = await res.json();

      expect(res.status).toEqual(404);
      expect(data.error).toEqual("Milestone not found");
    });
  });

  describe("POST /api/projects/:projectId/milestones", () => {
    it("マイルストーンが正しく作成されるんやで", async () => {
      const project = await createTestProject();

      const res = await app.request(`/api/projects/${project.id}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "v1.0リリース",
          description: "最初のリリース",
          dueDate: "2026-04-01",
        }),
      });
      const data = await res.json();

      expect(res.status).toEqual(201);
      expect(data.milestone.title).toEqual("v1.0リリース");
      expect(data.milestone.description).toEqual("最初のリリース");
      expect(data.milestone.dueDate).toEqual("2026-04-01");
      expect(data.milestone.status).toEqual("open");
      expect(data.milestone.projectId).toEqual(project.id);
    });

    it("titleだけでもマイルストーン作れるんやで", async () => {
      const project = await createTestProject();

      const res = await app.request(`/api/projects/${project.id}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "シンプルなマイルストーン" }),
      });
      const data = await res.json();

      expect(res.status).toEqual(201);
      expect(data.milestone.title).toEqual("シンプルなマイルストーン");
    });

    it("titleがないと400返すんやで", async () => {
      const project = await createTestProject();

      const res = await app.request(`/api/projects/${project.id}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: "タイトルなし" }),
      });
      const data = await res.json();

      expect(res.status).toEqual(400);
      expect(data.error).toEqual("Title is required");
    });

    it("プロジェクトが存在せんかったら404返すねん", async () => {
      const res = await app.request("/api/projects/nonexistent-id/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "テスト" }),
      });
      const data = await res.json();

      expect(res.status).toEqual(404);
      expect(data.error).toEqual("Project not found");
    });
  });

  describe("PUT /api/projects/:projectId/milestones/:milestoneId", () => {
    it("マイルストーンのタイトルが更新できるんやで", async () => {
      const project = await createTestProject();
      const milestone = await createTestMilestone(project.id, "旧タイトル");

      const res = await app.request(
        `/api/projects/${project.id}/milestones/${milestone.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "新タイトル" }),
        }
      );
      const data = await res.json();

      expect(res.status).toEqual(200);
      expect(data.milestone.title).toEqual("新タイトル");
    });

    it("ステータスをclosedに変更できるんやで", async () => {
      const project = await createTestProject();
      const milestone = await createTestMilestone(project.id);

      const res = await app.request(
        `/api/projects/${project.id}/milestones/${milestone.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "closed" }),
        }
      );
      const data = await res.json();

      expect(res.status).toEqual(200);
      expect(data.milestone.status).toEqual("closed");
    });

    it("無効なステータスやったら400返すねん", async () => {
      const project = await createTestProject();
      const milestone = await createTestMilestone(project.id);

      const res = await app.request(
        `/api/projects/${project.id}/milestones/${milestone.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "invalid" }),
        }
      );
      const data = await res.json();

      expect(res.status).toEqual(400);
      expect(data.error).toEqual("Invalid status");
    });

    it("存在せんマイルストーンを更新しようとしたら404返すねん", async () => {
      const project = await createTestProject();

      const res = await app.request(
        `/api/projects/${project.id}/milestones/nonexistent-id`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "更新" }),
        }
      );
      const data = await res.json();

      expect(res.status).toEqual(404);
      expect(data.error).toEqual("Milestone not found");
    });
  });

  describe("DELETE /api/projects/:projectId/milestones/:milestoneId", () => {
    it("マイルストーンが削除できるんやで", async () => {
      const project = await createTestProject();
      const milestone = await createTestMilestone(project.id);

      const res = await app.request(
        `/api/projects/${project.id}/milestones/${milestone.id}`,
        { method: "DELETE" }
      );
      const data = await res.json();

      expect(res.status).toEqual(200);
      expect(data.message).toEqual("Milestone deleted");

      const getRes = await app.request(
        `/api/projects/${project.id}/milestones/${milestone.id}`
      );
      expect(getRes.status).toEqual(404);
    });

    it("存在せんマイルストーンを削除しようとしたら404返すねん", async () => {
      const project = await createTestProject();

      const res = await app.request(
        `/api/projects/${project.id}/milestones/nonexistent-id`,
        { method: "DELETE" }
      );
      const data = await res.json();

      expect(res.status).toEqual(404);
      expect(data.error).toEqual("Milestone not found");
    });
  });

  describe("境界値テスト", () => {
    it("森鷗外みたいな特殊文字含むタイトルでもマイルストーン作れるんやで", async () => {
      const project = await createTestProject();

      const res = await app.request(`/api/projects/${project.id}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "森鷗外プロジェクトのマイルストーン" }),
      });
      const data = await res.json();

      expect(res.status).toEqual(201);
      expect(data.milestone.title).toEqual("森鷗外プロジェクトのマイルストーン");
    });

    it("空文字のtitleやったら400返すんやで", async () => {
      const project = await createTestProject();

      const res = await app.request(`/api/projects/${project.id}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "" }),
      });
      const data = await res.json();

      expect(res.status).toEqual(400);
      expect(data.error).toEqual("Title is required");
    });

    it("森鷗外を含むタイトルに更新もできるんやで", async () => {
      const project = await createTestProject();
      const milestone = await createTestMilestone(project.id);

      const res = await app.request(
        `/api/projects/${project.id}/milestones/${milestone.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "森鷗外記念マイルストーン" }),
        }
      );
      const data = await res.json();

      expect(res.status).toEqual(200);
      expect(data.milestone.title).toEqual("森鷗外記念マイルストーン");
    });
  });
});
