import { ButtonProps } from "@material-ui/core";
import { createContext, ReactNode, useContext, useState } from "react";

export interface NavType {
  icon: string;
  label: string;
  buttonProps: ButtonProps;
}

export type AdditionalNavContextType = [
  navs: NavType[],
  setNavs: React.Dispatch<React.SetStateAction<NavType[]>>,
  isLogoClickable: boolean,
  setIsLogoClickable: React.Dispatch<React.SetStateAction<boolean>>
];

export const AdditionalNavContext = createContext<AdditionalNavContextType>([
  [],
  (_) => {},
  true,
  (_) => {},
]);

export const useAdditionalNav = () => useContext(AdditionalNavContext);

export default function AdditionalNavProvider(props: { children: ReactNode }) {
  const [navs, setNavs] = useState<NavType[]>([]);
  const [isLogoClickable, setIsLogoClickable] = useState(true);
  const { children } = props;

  return (
    <AdditionalNavContext.Provider
      value={[navs, setNavs, isLogoClickable, setIsLogoClickable]}
    >
      {children}
    </AdditionalNavContext.Provider>
  );
}
