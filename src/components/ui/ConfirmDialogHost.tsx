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
    /*
      연타 방지. 버튼이 로딩으로 바뀌기 전에 두 번 눌리면 onConfirm 이 두 번 돈다 —
      지급 · 삭제가 두 번 나간다. 렌더 값은 한 박자 늦으므로 스토어에서 바로 읽는다.
    */
    if (!options || useConfirmStore.getState().isProcessing) return;

    try {
      setProcessing(true);
      await options.onConfirm();
      closeConfirm();
    } catch (error) {
      /*
        실패 안내는 여기 한 곳이다. 뮤테이션 훅의 onError 가 이미 같은 실패를 띄웠으면
        showErrorToast 가 걸러 두 번 뜨지 않는다.
      */
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
