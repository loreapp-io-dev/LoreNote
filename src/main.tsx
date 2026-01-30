import ReactDOM from "react-dom/client";
import { I18nProvider } from "./i18n";
import { ThemeProvider } from "./theme";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <I18nProvider>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </I18nProvider>,
);
