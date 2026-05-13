import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppProvider } from "./contexts/AppContext";
import HomePage from "./pages/HomePage";
import PracticePage from "./pages/PracticePage";
import SongPage from "./pages/SongPage";
import GamePage from "./pages/GamePage";
import MyPage from "./pages/MyPage";
import PitchModePage from "./pages/PitchModePage";
import WarmupPage from "./pages/WarmupPage";
import ScalePage from "./pages/ScalePage";
import CurriculumPage from "./pages/CurriculumPage";
import SongPracticePage from "./pages/SongPracticePage";
import SealGamePage from "./pages/SealGamePage";
import PenguinGamePage from "./pages/PenguinGamePage";
import AlbumsPage from "./pages/AlbumsPage";
import BottomNav from "./components/BottomNav";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <div className="app-container bg-app-gradient">
      <div className="app-content">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/practice" component={PracticePage} />
          <Route path="/practice/pitch" component={PitchModePage} />
          <Route path="/practice/warmup" component={WarmupPage} />
          <Route path="/practice/scale" component={ScalePage} />
          <Route path="/practice/curriculum" component={CurriculumPage} />
          <Route path="/songs" component={SongPage} />
          <Route path="/songs/:id" component={SongPracticePage} />
          <Route path="/game" component={GamePage} />
          <Route path="/game/seal" component={SealGamePage} />
          <Route path="/game/penguin" component={PenguinGamePage} />
          <Route path="/mypage" component={MyPage} />
          <Route path="/mypage/albums" component={AlbumsPage} />
          <Route component={NotFound} />
        </Switch>
      </div>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AppProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
