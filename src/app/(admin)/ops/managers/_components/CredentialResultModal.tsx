"use client";

import { useState } from "react";
import { Check, Copy } from "@/icons";
import { showAppToast } from "@/lib/toast";
import type { ManagerCredentialIssued } from "@/type/ops";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

interface CredentialResultModalProps {
  /** 값이 있으면 열린다. 닫으면 임시 비밀번호는 화면에서 사라진다. */
  result?: ManagerCredentialIssued;
  onClose: () => void;
  /** 초대 직후인지, 비밀번호 초기화 직후인지 */
  mode: "INVITE" | "RESET";
}

/**
 * 임시 비밀번호 안내.
 *
 * **이 값은 다시 볼 수 없다.** 서버가 저장해 두고 재조회를 열어 주면 평문
 * 비밀번호를 언제든 꺼낼 수 있다는 뜻이라, 초기화 기능이 있는 의미가 없어진다.
 * 그래서 화면도 한 번만 보여 주고, 닫기 전에 복사하도록 분명히 말한다.
 */
const CredentialResultModal = ({
  result,
  onClose,
  mode,
}: CredentialResultModalProps) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(result.temporaryPassword);
      setIsCopied(true);
      showAppToast("success", "임시 비밀번호를 복사했습니다.");
    } catch {
      // 클립보드 권한이 없는 환경에서는 직접 선택해 복사해야 한다.
      showAppToast("warning", "복사에 실패했습니다. 값을 직접 선택해 주세요.");
    }
  };

  const handleClose = () => {
    setIsCopied(false);
    onClose();
  };

  return (
    <Modal
      isOpen={Boolean(result)}
      onClose={handleClose}
      closeOnOverlayClick={false}
      title={mode === "INVITE" ? "관리자를 초대했습니다" : "비밀번호를 초기화했습니다"}
      description={result?.email ?? ""}
      size="sm"
      footer={
        <Button variant="primary" onClick={handleClose}>
          확인했습니다
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        <Alert tone="warning" title="이 화면을 닫으면 다시 볼 수 없습니다.">
          임시 비밀번호를 본인에게 전달해 주세요. 첫 로그인에서 비밀번호를 바꾸기
          전까지는 콘솔을 사용할 수 없습니다.
        </Alert>

        <div className="flex items-center justify-between gap-3 rounded-field border border-border-main bg-subtle px-3.5 py-3">
          <code className="truncate body-3 font-semibold text-font-1 select-all">
            {result?.temporaryPassword}
          </code>

          <Button
            size="sm"
            variant="secondary"
            leftIcon={isCopied ? <Check size={14} /> : <Copy size={14} />}
            onClick={handleCopy}
          >
            {isCopied ? "복사됨" : "복사"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CredentialResultModal;
