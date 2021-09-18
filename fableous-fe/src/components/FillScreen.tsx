import { ReactNode, useRef } from "react";

interface FillScreenProps {
  children: ReactNode;
  isShown?: boolean;
}

const FillScreen = (props: FillScreenProps) => {
  const { children, isShown } = props;
  const ref = useRef<HTMLDivElement>(document.createElement("div"));

  return (
    <div
      ref={ref}
      className={`flex flex-col absolute w-full ${!isShown && "invisible"}`}
      style={{
        height: `calc(100vh - ${ref.current.getBoundingClientRect().y}px)`,
      }}
    >
      {children}
    </div>
  );
};

FillScreen.defaultProps = {
  isShown: true,
};

export default FillScreen;
