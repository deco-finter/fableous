import { useContext, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { setupResponseInterceptor } from "../api";
import { AuthContext } from "./AuthProvider";

/**
 * Component to place in top-level App to clear auth token when it expires.
 * 
 * It is done by attaching a callback within React context to run 
 * when axios' response interceptor receives 401 Unauthorized with token expiry error message.
 */
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
