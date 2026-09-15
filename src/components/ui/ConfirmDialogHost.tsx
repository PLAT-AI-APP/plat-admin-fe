"use client";

import { useConfirmStore } from "@/store/useConfirmStore";
import { showErrorToast } from "@/lib/toast";
import Button from "./Button";
import Modal from "./Modal";

/**
 * 전역 확인 다이얼로그. 루트 레이아웃에 한 번만 마운트한다.
 * 화면에서는 openConfirm({ ... })으로만 호출한다.
 */
const ConfirmDialogHost = () => {
  const { options, isProcessing, closeConfirm, setProcessing } =
    useConfirmStore();

  const isDanger = options?.tone === "danger";

  const handleConfirm = async () => {
    if (!options) return;

    try {
      setProcessing(true);
      await options.onConfirm();
      closeConfirm();
    } catch (error) {
      showErrorToast(error);
      setProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={Boolean(options)}
      onClose={closeConfirm}
      title={options?.title ?? ""}
      description={options?.description}
      size="sm"
      // 파괴적 작업은 오버레이 클릭으로 닫히면 안 된다.
      closeOnOverlayClick={false}
      footer={
        <>
          {/*
            처음 포커스는 위험하지 않은 쪽에 둔다. 일반 확인은 Enter 한 번으로 끝내고,
            파괴적 작업은 Enter를 무심코 눌러도 취소되게 한다.
          */}
          <Button
            variant="ghost"
            onClick={closeConfirm}
            disabled={isProcessing}
            data-autofocus={isDanger ? "" : undefined}
          >
            {options?.cancelText ?? "취소"}
          </Button>

          <Button
            variant={isDanger ? "danger" : "primary"}
            onClick={handleConfirm}
            isLoading={isProcessing}
            data-autofocus={isDanger ? undefined : ""}
          >
            {options?.confirmText ?? "확인"}
          </Button>
        </>
      }
    >
      {options?.warning ? (
        <p className="body-5 text-font-error">{options.warning}</p>
      ) : (
        <p className="body-5 text-font-2">
          이 작업을 진행하시겠습니까?
        </p>
      )}
    </Modal>
  );
};

export default ConfirmDialogHost;
