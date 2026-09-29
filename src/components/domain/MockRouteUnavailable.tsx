"use client";

import { Info } from "@/icons";
import Card from "@/components/ui/Card";

/**
 * 실서버 환경에서 MOCK 화면 주소로 들어왔을 때의 안내.
 *
 * 붙을 API 가 없는 화면을 그대로 그리면 오류 토스트와 빈 표만 남아,
 * 운영자는 장애인지 아직 없는 기능인지 구분할 수 없다.
 */
const MockRouteUnavailable = () => (
  <Card noPadding>
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-subtle text-font-2">
        <Info size={24} />
      </span>

      <div className="flex flex-col gap-1">
        <p className="body-3 font-semibold text-font-0">
          아직 준비 중인 화면입니다.
        </p>
        <p className="body-5 text-font-2">
          서버 기능이 연결되면 메뉴에 나타납니다.
        </p>
      </div>
    </div>
  </Card>
);

export default MockRouteUnavailable;
