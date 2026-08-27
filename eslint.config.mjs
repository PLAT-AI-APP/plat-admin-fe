import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 어드민 템플릿은 자체 tsconfig · eslint 설정을 가진 독립 프로젝트다.
    // 여기서 함께 검사하면 `@/*` 별칭이 이 프로젝트의 src로 풀려 전부 깨진다.
    "plat-admin-template/**",
  ]),
]);

export default eslintConfig;
