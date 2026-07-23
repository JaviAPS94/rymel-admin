import { Route, Switch, Redirect } from "wouter";
import { Toaster } from "sonner";
import { LoginPage } from "@pages/LoginPage";
import { DashboardPage } from "@pages/DashboardPage";
import { UsersPage } from "@pages/UsersPage";
import { BomListPage } from "@pages/BomListPage";
import { BomEditorPage } from "@pages/BomEditorPage";
import { DesignCodeRulesPage } from "@pages/DesignCodeRulesPage";
import { ProtectedRoute } from "@components/ProtectedRoute";
import { useAuthStore } from "@store/authStore";
import { Role } from "@/types/user.types";

const App = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <>
      <Switch>
        <Route path="/login">
          {isAuthenticated ? <Redirect to="/dashboard" /> : <LoginPage />}
        </Route>

        <Route path="/dashboard">
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        </Route>

        <Route path="/users">
          <ProtectedRoute>
            <UsersPage />
          </ProtectedRoute>
        </Route>

        <Route path="/bom">
          <ProtectedRoute>
            <BomListPage />
          </ProtectedRoute>
        </Route>

        <Route path="/bom/:id">
          <ProtectedRoute>
            <BomEditorPage />
          </ProtectedRoute>
        </Route>

        <Route path="/design-code-rules">
          <ProtectedRoute roles={[Role.ADMIN]}>
            <DesignCodeRulesPage />
          </ProtectedRoute>
        </Route>

        <Route path="/">
          <Redirect to={isAuthenticated ? "/dashboard" : "/login"} />
        </Route>

        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>

      <Toaster position="top-right" richColors />
    </>
  );
};

export default App;
