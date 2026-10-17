import { AppProviders } from "@/app/providers";
import { AppRouter } from "@/app/AppRouter";

export function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
}
