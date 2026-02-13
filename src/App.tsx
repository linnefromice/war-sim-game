import { ErrorBoundary } from "./components/ErrorBoundary";
import { Stage } from "./pages/Stage";

const App = () => (
  <ErrorBoundary>
    <Stage />
  </ErrorBoundary>
)

export default App
