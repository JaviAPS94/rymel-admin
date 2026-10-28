import { Route, Switch, Redirect } from "wouter";
import { Toaster } from "sonner";
import { LoginPage } from "@pages/LoginPage";
import { DashboardPage } from "@pages/DashboardPage";
import { UsersPage } from "@pages/UsersPage";
import { BomListPage } from "@pages/BomListPage";
import { BomEditorPage } from "@pages/BomEditorPage";
import { DesignCodeRulesPage } from "@pages/DesignCodeRulesPage";
import { FormulasPage } from "@pages/FormulasPage";
import { TemplateListPage } from "@pages/TemplateListPage";
import { TemplateEditorPage } from "@pages/TemplateEditorPage";
import { PhantomItemListPage } from "@pages/PhantomItemListPage";
import { PhantomItemEditorPage } from "@pages/PhantomItemEditorPage";
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

        <Route path="/formulas">
          <ProtectedRoute roles={[Role.ADMIN]}>
            <FormulasPage />
          </ProtectedRoute>
        </Route>

        <Route path="/templates">
          <ProtectedRoute roles={[Role.ADMIN]}>
            <TemplateListPage />
          </ProtectedRoute>
        </Route>

        <Route path="/templates/:id">
          <ProtectedRoute roles={[Role.ADMIN]}>
            <TemplateEditorPage />
          </ProtectedRoute>
        </Route>

        <Route path="/phantom-items">
          <ProtectedRoute roles={[Role.ADMIN, Role.DESIGN, Role.NORM]}>
            <PhantomItemListPage />
          </ProtectedRoute>
        </Route>

        <Route path="/phantom-items/:id">
          <ProtectedRoute roles={[Role.ADMIN, Role.DESIGN, Role.NORM]}>
            <PhantomItemEditorPage />
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
