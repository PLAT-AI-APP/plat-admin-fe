import { Fragment, ReactNode } from "react";

interface TableCellStackProps {
  primary: ReactNode;
  secondary?: ReactNode;
}

/** 표 셀 안에서 이름 + 보조 정보를 함께 보여줄 때 사용한다. */
const TableCellStack = ({ primary, secondary }: TableCellStackProps) => (
  <Fragment>
    <p className="text-font-1">{primary}</p>
    {secondary && <p className="mt-0.5 body-6 text-font-2">{secondary}</p>}
  </Fragment>
);

export default TableCellStack;
