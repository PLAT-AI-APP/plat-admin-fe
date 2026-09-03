# 문의·신고 첨부파일 도입 계획

> Q&A(문의)와 신고에 첨부파일을 받기 위한 정책·백엔드 설계·화면 계획.
> 대상 코드는 `plat-be`의 `plat-data/.../data/file` 과 `plat-admin-fe`의 Q&A·신고 화면이다.

---

## 0. 결론 먼저

**`FileType`에 값 하나 더 넣는 걸로는 안 된다.** 지금 파일 저장소는 "이미지를 받아
webp 변형본으로 쪼개 공개 URL로 서빙한다"는 전제가 코드 곳곳에 박혀 있다. 첨부는
그 전제 셋(이미지 · 변형본 · 공개)을 전부 깬다.

그래서 세 갈래로 나눠서 본다.

1. **무엇을 얼마나 받을지** — 확장자·용량·개수·보존기간 (§2)
2. **저장 파이프라인 분기** — 이미지 변환을 타지 않는 원본 저장 경로 (§3-1 ~ §3-3)
3. **비공개 서빙** — 첨부는 공개 URL로 두면 안 된다 (§3-4)

그리고 **신고부터 한다.** 신고는 `reports` 테이블이 실재하지만 Q&A는 백엔드 엔티티
자체가 없다(§4).

---

## 1. 지금 구조로 안 되는 이유

| # | 막히는 지점 | 현재 코드 | 왜 막히나 |
|---|---|---|---|
| B1 | 확장자 화이트리스트가 전역·이미지 전용 | `MultipartFileUtil.ALLOWED_EXTENSIONS = {jpg, jpeg, png, webp}` | PDF·로그 파일은 검증 단계에서 바로 `FILE_EXTENSION_UNSUPPORTED` |
| B2 | 업로드가 곧 이미지 변환 | `FileServiceImpl.storeFiles()` → `converter.decode(origin)` → `toWebp()` | PDF 바이트를 디코드하려 들어 `FILE_CONVERT_FAILED`. 저장 경로에 "원본 그대로" 분기가 없다 |
| B3 | 정책이 변형본을 **필수**로 요구 | `FileTypePolicy` 컴팩트 생성자: `variants`가 비었거나 `ORIGIN`이 없으면 `ConfigurationException` | "변형본 없이 원본 1개"라는 개념 자체가 표현 불가 |
| B4 | 서빙이 공개 고정 | `FileServiceImpl.resolveUrl()`의 `case PRIVATE, PROTECTED -> throw InternalServerException`, `ResourceController`가 `Content-Type: image/webp` + `Cache-Control: public, max-age=1년, immutable` 하드코딩 | 첨부에는 결제 화면·대화 캡처 같은 개인정보가 들어간다. 공개 URL + 1년 캐시로 내보내면 안 된다 |
| B5 | 메타데이터 컬럼이 없다 | `FileEntity`에 `original_name` / `content_type` / `byte_size` 없음 | 목록에 "영수증.pdf · 240KB"를 그릴 수 없고, 다운로드 시 원본 파일명을 되돌려줄 수 없다 |
| B6 | 소유자가 유저 하나뿐 | `confirm(UserId, ...)` / `release(UserId, ...)` | 관리자가 답변에 캡처를 붙이면 소유자에 넣을 값이 없다(관리자는 `ManagerId`) |
| B7 | 첨부↔대상 연결이 없다 | `reports` 테이블에 첨부 참조 없음. Q&A는 엔티티 자체가 없음 | 어떤 파일이 어느 문의/신고의 것인지 알 방법이 없다 |

이 중 **B3·B4가 본체**다. 나머지는 부수 작업이다.

---

## 2. 비즈니스 정책 (제안)

### 2-1. 받을 것 / 안 받을 것

| | 확장자 | 비고 |
|---|---|---|
| 받는다 (1차) | `jpg` `jpeg` `png` `webp` `pdf` | 문의·신고의 90%는 스크린샷이다. PDF는 영수증·명세서 때문에 필요하다 |
| 받는다 (2차) | `txt` `log` | 오류 신고용. 텍스트는 안전하지만 실사용 빈도를 보고 결정 |
| **안 받는다** | `zip` `7z` `exe` `apk` `dmg` `html` `svg` | 압축은 내용물을 검사할 수 없어 악성코드 유통 경로가 된다. HTML·SVG는 스크립트를 품어 열람 시 XSS가 된다 |
| 보류 | `mp4` `mov` | 화면 녹화 요청은 실제로 들어온다. 다만 용량 상한과 스토리지 비용이 한 자릿수 달라지므로 1차에서 뺀다 |

**확장자만 믿지 않는다.** 업로드 시 파일 시그니처(magic number)로 실제 타입을 확인하고
선언된 확장자와 다르면 거부한다. `report.pdf`로 이름만 바꾼 실행 파일이 그대로 들어온다.

### 2-2. 용량·개수

| 구분 | 최대 개수 | 파일당 | 요청당 합계 |
|---|---|---|---|
| 문의 등록 (유저) | 5 | 10MB | 30MB |
| 문의 답변 (관리자) | 3 | 10MB | 20MB |
| 신고 등록 (유저) | 3 | 10MB | 20MB |

근거:

- 스마트폰 스크린샷 1장이 1~3MB, 원본 사진이 3~8MB다. **10MB면 원본 사진도 그대로 들어온다.**
- 현재 `spring.servlet.multipart.max-file-size`가 **15MB**(local/dev/prod 동일)라
  10MB 정책이 그 아래에 있다. 스프링 단에서 먼저 잘려 우리 에러 코드가 안 나가는 일이 없다.
  `max-request-size`는 260MB라 이미 충분하다.
- 개수 5는 "결제 → 오류 → 잔액" 같은 연속 캡처를 담기 충분하고, 검토자가 한 화면에서
  훑을 수 있는 상한이다. 개수를 늘리는 건 언제든 되지만 줄이는 건 안 된다.

### 2-3. 보존기간

**첨부 원본과 처리 기록의 수명을 분리한다.**

| 대상 | 보존 | 이유 |
|---|---|---|
| 문의·신고 **본문과 처리 이력** | 3년 | 소비자 불만·분쟁 처리 기록 보존 의무 |
| 첨부 **원본 파일** | 종료 후 180일 | 첨부에는 결제 화면·연락처·제3자 대화 같은 개인정보가 섞이기 쉽다. 최소 보관이 맞다 |

문의가 `CLOSED`가 되거나 신고가 처리 완료되는 시점에 첨부의 `expiredAt`을 +180일로
찍고 `INACTIVE`로 내린다. **`FileStatus` + `expiredAt` + `FilePurgeService`가 이미
그대로 있으므로 만료일만 길게 잡으면 새로 만들 것이 없다.**

> 법무 확인 필요 — 첨부 원본이 3년 보존 대상에 포함되는지. 포함이면 180일 대신 3년으로 맞춘다.

### 2-4. 접근 통제

- **첨부는 공개 URL로 두지 않는다.** 신고 첨부에는 신고당한 제3자의 대화 캡처가 들어간다.
- 유저는 자기가 올린 첨부만 본다.
- 관리자는 `qna:read` / `report:read` 권한이 있을 때만 본다.
- **관리자 다운로드는 감사 로그에 남긴다.** 어드민 `LOG_ACTIONS`의 `COMMUNITY` 도메인에
  `QNA_ATTACHMENT_DOWNLOAD` / `REPORT_ATTACHMENT_DOWNLOAD`를 추가한다.
- 신고 첨부는 피신고자에게 노출하지 않는다.

---

## 3. 백엔드 설계 (plat-be)

### 3-1. `FileTypePolicy`를 이미지형/문서형 두 갈래로 나눈다

```java
public enum FileKind { IMAGE, DOCUMENT }

public record FileTypePolicy(FilePath path,
                             FileKind kind,
                             Set<String> allowedExtensions,
                             long maxBytesPerFile,
                             int maxCount,
                             List<ImageVariant> variants,
                             FileAccess access) { ... }
```

컴팩트 생성자의 검증을 `kind`로 뒤집는다.

- `IMAGE` → 지금과 같다. `variants`에 `ORIGIN`이 반드시 있어야 한다.
- `DOCUMENT` → `variants`가 **비어 있어야** 한다. 변형본을 만들지 않는다는 뜻이다.

`MultipartFileUtil.validate()`가 전역 상수 대신 `FileTypePolicy.of(type).allowedExtensions()`를
본다. 기존 이미지 타입에 지금 목록을 그대로 넣으면 **동작은 하나도 안 바뀐다.**

새 `FileType`:

```
QNA_ATTACHMENT, QNA_ANSWER_ATTACHMENT, REPORT_ATTACHMENT
```

```java
FileType.REPORT_ATTACHMENT, new FileTypePolicy(
    FilePath.of("reports", "attachments"),
    FileKind.DOCUMENT,
    Set.of("jpg", "jpeg", "png", "webp", "pdf"),
    10 * 1024 * 1024L,
    3,
    List.of(),
    FileAccess.PROTECTED)
```

### 3-2. 저장 분기

```java
private void storeFiles(FileUploadCommand command, byte[] origin) {
    var policy = FileTypePolicy.of(command.fileType());

    if (policy.kind() == FileKind.DOCUMENT) {
        // 원본 바이트 그대로. 변환하면 증거로서의 값이 사라진다.
        writer.store(origin, documentKey(command));
        return;
    }

    // 기존 이미지 변환 루프 그대로
}
```

- 문서형 저장 키는 `{path}/{fileId}/origin.{ext}`로 둔다. **File 1건 = 디렉토리 1개**
  모델을 그대로 지켜야 `FilePurgeService.removeDirectory`가 손대지 않고 재사용된다.
- 문서형은 이미지가 들어와도 webp로 변환하지 않는다. 신고 증거는 해상도와 EXIF가 곧
  증거라 손대면 안 된다.

### 3-3. `FileEntity` 메타데이터 컬럼

```sql
ALTER TABLE files
  ADD COLUMN original_name VARCHAR(255),
  ADD COLUMN content_type  VARCHAR(100),
  ADD COLUMN byte_size     BIGINT;
```

기존 행 때문에 **nullable로 추가**한다. 이미지 타입은 이 값을 읽지 않으므로 백필이
필요 없고, 문서형은 처음부터 채워서 들어온다. `content_type`은 클라이언트가 보낸
헤더가 아니라 **서버가 magic number로 판정한 값**을 넣는다.

### 3-4. 비공개 서빙 — 이번 작업의 본체

`resolveUrl()`의 `case PRIVATE, PROTECTED -> throw` 자리를 실제로 채운다.

두 가지 방식이 있다.

| | 앱 경유 스트리밍 | S3 서명 URL |
|---|---|---|
| 동작 | 서버가 권한 확인 후 바이트를 흘려준다 | 5분 만료 presigned URL을 발급한다 |
| 트래픽 | 앱이 진다 | S3가 진다 |
| 로컬 환경 | 그대로 동작 | `LocalFileStorageAdapter`에 동등물이 없어 개발/운영이 갈린다 |
| 감사 로그 | 남기기 쉽다 | 발급만 남고 실제 열람은 못 잡는다 |

**앱 경유 스트리밍으로 시작한다.** 첨부는 문의·신고 건수만큼만 생기고 관리자만 열어보므로
트래픽이 문제 되는 규모가 아니다. 나중에 갈아탈 수 있도록 `FileStorageReader`에
`byte[] readBytes(FilePath)` 하나를 추가해 둔다.

`ResourceController`는 `image/webp` 고정이라 재사용할 수 없다. 새로 만든다.

```
GET /files/{fileId}         유저용 — 본인 첨부만
GET /admin/files/{fileId}   관리자용 — 권한 확인 + 감사 로그
```

응답 헤더:

```
Content-Type: {저장해 둔 content_type}
Content-Disposition: attachment; filename*=UTF-8''{원본 파일명}
Cache-Control: private, no-store
X-Content-Type-Options: nosniff
```

`Content-Disposition: attachment`를 **항상** 붙인다. inline으로 내려주면 브라우저가
파일을 실행 가능한 문서로 해석할 여지가 생긴다.

### 3-5. 첨부 ↔ 대상 연결

지금 `files`는 소유자(`user_id`)만 알고 "무엇에 붙었는지"를 모른다. 두 선택지가 있다.

- (A) 도메인 쪽에 조인 테이블을 둔다
- (B) `files`에 `target_type` / `target_id`를 단다

**(A) 조인 테이블을 쓴다.** `files`는 이미 프로필·세계관·캐릭터가 함께 쓰는 범용
테이블이다. 여기에 대상을 달면 첨부를 받는 도메인이 늘 때마다 이 테이블이 부풀고,
결국 "이 컬럼은 어떤 타입일 때만 의미 있다"는 규칙이 코드에 흩어진다.

```sql
CREATE TABLE report_attachments (
    report_id  BIGINT NOT NULL,
    file_id    BIGINT NOT NULL,
    sort_order INT    NOT NULL,
    PRIMARY KEY (report_id, file_id)
);
```

Q&A도 같은 모양(`qna_attachments`)으로 둔다.

### 3-6. 업로드 흐름 — **이미 다 있다**

1. 유저가 파일 선택 → `tempUpload` (INACTIVE + 7일 만료) → `fileId` 반환
2. 문의/신고 등록 본문에 `fileIds` 배열을 실어 보냄
3. 등록 트랜잭션에서 `confirm(userId, fileId, expectedType)` → ACTIVE + 조인 테이블 기록
4. 등록하지 않고 이탈하면 7일 뒤 스케줄러가 정리

**이 흐름은 손댈 게 없다.** 새로 만드는 것은 정책(§3-1)·저장 분기(§3-2)·서빙(§3-4)뿐이다.

---

## 4. Q&A는 백엔드가 아직 없다

- `plat-entity`에 QnA 엔티티가 없다. 어드민의 Q&A 화면은 **MSW 목업으로만** 돈다.
- 신고는 `plat-entity/feedback/ReportEntity`(`reports` 테이블)가 실재한다.
  다만 어드민이 쓰는 신고 모델(대상 타입·사유·처리자)과 지금 엔티티(`FeedbackType`·
  `FeedbackStatus`)가 서로 다르므로 매핑 정리가 함께 필요하다.

→ **첨부는 신고부터 붙인다.** Q&A는 엔티티·API를 새로 만들 때 첨부를 처음부터 포함시킨다.
그전까지 어드민 Q&A 화면에는 목업으로 첨부 UI를 먼저 그려 계약만 맞춰 둔다.

---

## 5. 어드민 화면 변경 (plat-admin-fe)

- `QnaDetailModal` — 문의 본문 아래 `첨부 N` 목록. 답변 폼에도 첨부 입력을 둔다.
- `ReportHandleModal` — 신고 본문 아래 같은 목록.
- 공용 컴포넌트 두 개를 만들어 두 화면이 같이 쓴다.
  - `AttachmentList` — 이미지면 썸네일 + 라이트박스, 그 외는 아이콘 · 파일명 · 용량 · 다운로드
  - `AttachmentUploadField` — 개수·용량·확장자 검증 후 즉시 임시 업로드, `fileId[]`를 폼에 넘긴다
- **`ImageUploadField`는 재사용할 수 없다.** 미리보기 비율·이미지 확장자 검증이 전제라
  PDF가 들어오면 빈 미리보기가 된다.
- 다운로드는 `<a href>`가 아니라 **axios로 blob을 받아 저장한다.** 보호 리소스라
  Authorization 헤더가 필요하고, 링크로는 헤더를 실을 수 없다.

---

## 6. 실행 순서

| 단계 | 범위 | 내용 |
|---|---|---|
| 1 | BE | `FileKind` + `FileTypePolicy` 확장, `MultipartFileUtil`을 정책 기반으로 전환 — **기존 동작 불변** |
| 2 | BE | `FileEntity` 메타 컬럼 3개 + 마이그레이션 |
| 3 | BE | 문서형 저장 분기 + magic number 검증 |
| 4 | BE | `PROTECTED` 서빙 컨트롤러 (유저용 / 관리자용) |
| 5 | BE | `REPORT_ATTACHMENT` + `report_attachments` + 신고 등록·조회 API에 첨부 포함 |
| 6 | FE | `AttachmentList` · `AttachmentUploadField` + 신고 화면 연결 |
| 7 | BE | QnA 엔티티·API 신설 (첨부 포함) |
| 8 | FE | Q&A 화면 연결, 목업 제거 |

1~4는 기존 이미지 동작을 그대로 둔 채 진행할 수 있다. **5부터 실제 화면이 바뀐다.**

---

## 7. 결정이 필요한 것

- **보존기간 180일**이 법무 기준에 맞는지. 첨부 원본이 3년 보존 대상에 포함되면 맞춰야 한다.
- **동영상(mp4) 첨부**를 1차에 넣을지. 넣으면 용량 상한과 스토리지 비용이 한 자릿수 달라진다.
- **관리자 다운로드 감사 로그**를 어느 수준까지 남길지 — 열람 시각·대상 파일까지 남길지.
- 관리자가 첨부를 **삭제**할 수 있게 할지. 개인정보가 실려 들어온 경우 지울 수단이 필요하지만,
  증거 인멸로도 쓰일 수 있어 권한을 따로 떼는 편이 안전하다.
