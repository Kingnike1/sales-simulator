import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import NewTraining from "./pages/NewTraining";
import TrainingChat from "./pages/TrainingChat";
import Evaluation from "./pages/Evaluation";
import History from "./pages/History";
import NotFound from "./pages/NotFound";
import { Route, Switch } from "wouter";

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/dashboard" component={Dashboard} />
    <Route path="/new-training" component={NewTraining} />
    <Route path="/history" component={History} />
    <Route path="/training/:id/evaluation" component={Evaluation} />
    <Route path="/training/:id" component={TrainingChat} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
