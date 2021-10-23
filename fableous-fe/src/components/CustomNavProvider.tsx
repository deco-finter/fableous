import { ButtonProps } from "@material-ui/core";
import { createContext, ReactNode, useContext, useState } from "react";

export interface Nav {
  icon: string;
  label: string;
  buttonProps: ButtonProps;
}

export type CustomNavContextType = [
  additionalNavs: Nav[],
  setAdditionalNavs: React.Dispatch<React.SetStateAction<Nav[]>>,
  isLogoClickable: boolean,
  setIsLogoClickable: React.Dispatch<React.SetStateAction<boolean>>
];

export const CustomNavContext = createContext<CustomNavContextType>([
  [],
  (_) => {},
  true,
  (_) => {},
]);

export const useCustomNav = () => useContext(CustomNavContext);

/**
 * Allows pages to have customized buttons in navbar.
 *
 * @example
 *
 * useEffect(() => {
 *  setAdditionalNavs(navItemsUniqueToThisPage)
 *
 *  return () => {
 *    setAdditionalNavs([])
 *  }
 * }, [])
 */
export default function CustomNavProvider(props: { children: ReactNode }) {
  const [additionalNavs, setAdditionalNavs] = useState<Nav[]>([]);
  const [isLogoClickable, setIsLogoClickable] = useState(true);
  const { children } = props;

  return (
    <CustomNavContext.Provider
      value={[
        additionalNavs,
        setAdditionalNavs,
        isLogoClickable,
        setIsLogoClickable,
      ]}
    >
      {children}
    </CustomNavContext.Provider>
  );
}
