import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CreditsComponent } from './pages/credits/credits.component';
import { CreditFormComponent } from './pages/credit-form/credit-form.component';
import { EvaluationDetailComponent } from './pages/evaluation-detail/evaluation-detail.component';
import { LoginComponent } from './pages/login/login.component';
import { AgentsComponent } from './pages/agents/agents.component';
import { ParametresComponent } from './pages/parametres/parametres.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'credits', component: CreditsComponent, canActivate: [authGuard] },
  { path: 'credits/nouveau', component: CreditFormComponent, canActivate: [authGuard] },
  { path: 'credits/:id', component: EvaluationDetailComponent, canActivate: [authGuard] },
  { path: 'clients', redirectTo: 'credits', pathMatch: 'full' },
  { path: 'clients/:id/credit', component: CreditFormComponent, canActivate: [authGuard] },
  { path: 'agents', component: AgentsComponent, canActivate: [authGuard] },
  { path: 'parametres', component: ParametresComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' },
];


