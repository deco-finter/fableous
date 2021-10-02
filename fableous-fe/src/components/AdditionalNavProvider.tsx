import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

export interface NavType {
  icon: string;
  label: string;
  onClickHandler: () => void;
  disabled: boolean;
}

export type AdditionalNavContextType = [
  navs: NavType[],
  setNavs: (navs: NavType[]) => void,
  clearNavs: () => void
];

export const AdditionalNavContext = createContext<AdditionalNavContextType>([
  [],
  (_) => {},
  () => {},
]);

export const useAdditionalNav = () => useContext(AdditionalNavContext);

export default function AdditionalNavProvider(props: { children: ReactNode }) {
  const [navs, setNavs] = useState<NavType[]>([]);
  const { children } = props;

  const clearNavs = useCallback(() => {
    setNavs([]);
  }, [setNavs]);

  return (
    <AdditionalNavContext.Provider value={[navs, setNavs, clearNavs]}>
      {children}
    </AdditionalNavContext.Provider>
  );
}
