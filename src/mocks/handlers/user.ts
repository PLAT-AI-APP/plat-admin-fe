import { HttpResponse, delay, http } from "msw";
import type {
  User,
  UserDetail,
  UserRole,
  UserStatus,
} from "@/type/user";
import { users } from "../db/user";
import { MOCK_DELAY_MS, matchesKeyword, nextId, paginate } from "../utils";

const BASE_URI = process.env.NEXT_PUBLIC_BASE_URI;

/** 목록 응답에는 상세 전용 필드(정지 사유·팔로우 수)를 내려주지 않는다. */
const toUserSummary = (user: UserDetail): User => ({
  userId: user.userId,
  nickname: user.nickname,
  email: user.email,
  profileImageUrl: user.profileImageUrl,
  phoneNumber: user.phoneNumber,
  status: user.status,
  role: user.role,
  provider: user.provider,
  isAdultVerified: user.isAdultVerified,
  adultVerifiedAt: user.adultVerifiedAt,
  birthDate: user.birthDate,
  gender: user.gender,
  isMarketingAgreed: user.isMarketingAgreed,
  creditBalance: user.creditBalance,
  characterCount: user.characterCount,
  chatCount: user.chatCount,
  totalPaidAmount: user.totalPaidAmount,
  lastLoginAt: user.lastLoginAt,
  lastLoginPlatform: user.lastLoginPlatform,
  createdAt: user.createdAt,
});

const findUser = (userId: number) =>
  users.find((user) => user.userId === userId);

const notFound = (message: string) =>
  HttpResponse.json({ code: "NOT_FOUND", message }, { status: 404 });

export const userHandlers = [
  http.get(`${BASE_URI}/admin/users`, async ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get("keyword") ?? "";
    const status = url.searchParams.get("status") as UserStatus | null;
    const role = url.searchParams.get("role") as UserRole | null;
    const isAdultVerified = url.searchParams.get("isAdultVerified") ?? "";

    const filtered = users.filter((user) => {
      if (status && user.status !== status) return false;
      if (role && user.role !== role) return false;
      if (
        isAdultVerified &&
        String(user.isAdultVerified) !== isAdultVerified
      ) {
        return false;
      }

      // 운영자가 CS 문의를 받을 때 휴대폰번호로 찾는 경우가 많다.
      return matchesKeyword(
        keyword,
        user.nickname,
        user.email,
        user.phoneNumber ?? "",
        String(user.userId),
      );
    });

    await delay(MOCK_DELAY_MS);

    return HttpResponse.json(paginate(filtered.map(toUserSummary), url));
  }),

  http.get(`${BASE_URI}/admin/users/:userId`, async ({ params }) => {
    const user = findUser(Number(params.userId));

    await delay(MOCK_DELAY_MS);

    if (!user) return notFound("존재하지 않는 유저입니다.");

    return HttpResponse.json(user);
  }),

  http.patch(
    `${BASE_URI}/admin/users/:userId/status`,
    async ({ params, request }) => {
      const user = findUser(Number(params.userId));
      const body = (await request.json()) as {
        status: UserStatus;
        reason?: string;
        suspendedUntil?: string;
      };

      if (!user) return notFound("존재하지 않는 유저입니다.");

      user.status = body.status;
      // 정지가 해제되면 사유·기간을 함께 비운다.
      user.suspendedReason =
        body.status === "SUSPENDED" ? body.reason : undefined;
      user.suspendedUntil =
        body.status === "SUSPENDED" ? body.suspendedUntil : undefined;

      await delay(MOCK_DELAY_MS);

      return HttpResponse.json(user);
    },
  ),

  http.patch(
    `${BASE_URI}/admin/users/:userId/role`,
    async ({ params, request }) => {
      const user = findUser(Number(params.userId));
      const { role } = (await request.json()) as { role: UserRole };

      if (!user) return notFound("존재하지 않는 유저입니다.");

      user.role = role;

      await delay(MOCK_DELAY_MS);

      return HttpResponse.json(user);
    },
  ),

];
