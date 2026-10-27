/**
 * 로컬 실행 전용 이미지 중계. 폴더 이름은 `IMAGE_PROXY_PATH`와 같아야 한다.
 *
 * rewrite 로 넘기면 이미지 서버의 302(S3)가 그대로 브라우저로 간다. 그런데 목업 워커가
 * 뜬 화면에서는 워커를 거친 리다이렉트 이미지가 실패한다. 그래서 서버에서 리다이렉트까지
 * 따라가 이미지 바이트를 돌려준다. 배포본은 이 경로를 쓰지 않으므로 404 로 닫는다.
 */

const IMAGE_BASE_URI = process.env.NEXT_PUBLIC_IMAGE_BASE_URI;

interface LiveImageRouteContext {
  params: Promise<{ path: string[] }>;
}

export async function GET(request: Request, { params }: LiveImageRouteContext) {
  if (process.env.NODE_ENV !== "development" || !IMAGE_BASE_URI) {
    return new Response(null, { status: 404 });
  }

  const { path } = await params;
  // 서명 원본의 `exp` · `sig` 쿼리를 그대로 넘긴다.
  const { search } = new URL(request.url);
  const upstream = await fetch(
    `${IMAGE_BASE_URI}/images/${path.map(encodeURIComponent).join("/")}${search}`,
    { cache: "no-store" },
  );

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/octet-stream",
      // 서명 원본은 길어야 30분 유효하다. 짧게만 캐시한다.
      "Cache-Control": "private, max-age=60",
    },
  });
}
