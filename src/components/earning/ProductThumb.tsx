import { ImageIcon } from "@/icons";

/** 교환 상품 목록 썸네일 */
const ProductThumb = ({ src }: { src?: string }) => (
  <span className="flex size-10 items-center justify-center overflow-hidden rounded-lg border border-border-main bg-surface-hover text-font-disabled">
    {src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className="size-full object-cover" />
    ) : (
      <ImageIcon size={16} />
    )}
  </span>
);

export default ProductThumb;
