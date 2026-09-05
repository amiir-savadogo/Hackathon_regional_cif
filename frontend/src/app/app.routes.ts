import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ClientListComponent } from './pages/client-list/client-list.component';
import { ClientNewComponent } from './pages/client-new/client-new.component';
import { CreditFormComponent } from './pages/credit-form/credit-form.component';
import { LoginComponent } from './pages/login/login.component';
import { AgentsComponent } from './pages/agents/agents.component';
import { ParametresComponent } from './pages/parametres/parametres.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'clients', component: ClientListComponent, canActivate: [authGuard] },
  { path: 'clients/nouveau', component: ClientNewComponent, canActivate: [authGuard] },
  { path: 'clients/:id/credit', component: CreditFormComponent, canActivate: [authGuard] },
  { path: 'agents', component: AgentsComponent, canActivate: [authGuard] },
  { path: 'parametres', component: ParametresComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' },
];


