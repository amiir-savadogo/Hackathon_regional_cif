import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ClientListComponent } from './pages/client-list/client-list.component';
import { ClientNewComponent } from './pages/client-new/client-new.component';
import { CreditFormComponent } from './pages/credit-form/credit-form.component';
import { AgentsComponent } from './pages/agents/agents.component';
import { ParametresComponent } from './pages/parametres/parametres.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'clients', component: ClientListComponent },
  { path: 'clients/nouveau', component: ClientNewComponent },
  { path: 'clients/:id/credit', component: CreditFormComponent },
  { path: 'agents', component: AgentsComponent },
  { path: 'parametres', component: ParametresComponent },
];


