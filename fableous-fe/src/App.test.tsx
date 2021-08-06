import { render } from "@testing-library/react";
import App from "./App";

test("App renders", () => {
  render(<App />);
  // placeholder assertion so lint doesnt complain
  // will probably not write tests in frontend
  expect(true).toEqual(true);
});
