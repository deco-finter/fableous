import { useContext, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { setupResponseInterceptor } from "../Api";
import { AuthContext } from "./AuthProvider";

export default function InjectAxiosRespInterceptor() {
  const history = useHistory();
  const [, , , clearToken] = useContext(AuthContext);

  useEffect(() => {
    setupResponseInterceptor(() => {
      clearToken();
      history.push("/login");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history]);

  return null;
}
