import { HttpResponse, delay, http } from "msw";
import { dashboardSummary } from "../db/dashboard";
import { buildServerHealth } from "../db/ops";
import { MOCK_DELAY_MS } from "../utils";

const BASE_URI = process.env.NEXT_PUBLIC_BASE_URI;

export const dashboardHandlers = [
  http.get(`${BASE_URI}/admin/dashboard/summary`, async () => {
    await delay(MOCK_DELAY_MS);

    // 서버 상태 카드가 서버 상태 화면과 어긋나지 않도록 같은 헬스체크를 사용한다.
    return HttpResponse.json({
      ...dashboardSummary,
      serverStatus: buildServerHealth().status,
    });
  }),
];
