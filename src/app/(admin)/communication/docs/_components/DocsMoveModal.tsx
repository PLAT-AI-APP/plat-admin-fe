"use client";

import { useState } from "react";
import type { DocsTreeNode } from "@/type/docs";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import FormField from "@/components/ui/FormField";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { moveTargets } from "@/app/(admin)/communication/docs/_lib/docsTree";

interface DocsMoveModalProps {
  /** 옮길 항목. 없으면 닫혀 있다. */
  node: DocsTreeNode | null;
  nodes: DocsTreeNode[];
  isSubmitting: boolean;
  onClose: () => void;
  /** 고른 부모(최상위는 `null`) 맨 뒤로 옮긴다. */
  onSubmit: (parentId: string | null) => void;
}

/** Select 값은 문자열이라 최상위를 따로 적는다. */
const ROOT_VALUE = "__root__";

/**
 * 다른 그룹으로 옮기기. 옮겨 간 그룹의 맨 뒤에 붙고, 순서는 트리에서 끌어서 맞춘다.
 *
 * 갈 수 없는 곳(깊이 3 초과 · 최상위 페이지 · 자기 하위)은 목록에 아예 내지 않는다.
 */
const DocsMoveModal = ({
  node,
  nodes,
  isSubmitting,
  onClose,
  onSubmit,
}: DocsMoveModalProps) => {
  const [target, setTarget] = useState("");
  const [openedFor, setOpenedFor] = useState<DocsTreeNode | null>(node);

  /* 새 항목으로 열릴 때마다 고른 값을 비운다. */
  if (node !== openedFor) {
    setOpenedFor(node);
    setTarget("");
  }

  const targets = node ? moveTargets(nodes, node) : [];
  const options = targets.map((item) => ({
    label: item.label,
    value: item.parentId ?? ROOT_VALUE,
  }));

  const submit = () => {
    if (!target) return;
    onSubmit(target === ROOT_VALUE ? null : target);
  };

  return (
    <Modal
      isOpen={node !== null}
      onClose={onClose}
      title="다른 그룹으로 이동"
      description={node ? `'${node.name}' 을(를) 옮길 그룹을 고르세요. 그 그룹의 맨 뒤에 붙습니다.` : undefined}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button
            variant="primary"
            onClick={submit}
            isLoading={isSubmitting}
            disabled={!target || isSubmitting}
          >
            이동
          </Button>
        </>
      }
    >
      {targets.length === 0 ? (
        <Alert tone="info" title="옮길 수 있는 그룹이 없습니다.">
          그룹은 3단까지만 둘 수 있고, 페이지는 최상위에 둘 수 없습니다.
        </Alert>
      ) : (
        <FormField
          label="옮길 곳"
          htmlFor="docs-move-target"
          required
          hint={node?.type === "GROUP" ? "하위 그룹까지 3단을 넘는 곳은 빠져 있습니다" : undefined}
        >
          <Select
            id="docs-move-target"
            placeholder="그룹 선택"
            options={options}
            value={target}
            onChange={(event) => setTarget(event.target.value)}
          />
        </FormField>
      )}
    </Modal>
  );
};

export default DocsMoveModal;
