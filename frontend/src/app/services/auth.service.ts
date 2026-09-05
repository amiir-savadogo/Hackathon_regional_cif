import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { AgentUser, AgentRole, AgenceCIF, CorbeilleItem } from '../models/user.model';

const STORAGE_AGENTS_KEY = 'samde_agents_list';
const STORAGE_CURRENT_USER_KEY = 'samde_current_agent_id';
const STORAGE_ROLES_KEY = 'samde_custom_roles_list';
const STORAGE_AGENCES_KEY = 'samde_custom_agences_list';
const STORAGE_TRASH_KEY = 'samde_trash_items';
const SESSION_KEY = 'samde_agent_session';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);

  private rolesSubject = new BehaviorSubject<AgentRole[]>(this.loadRoles());
  public roles$: Observable<AgentRole[]> = this.rolesSubject.asObservable();

  private agencesSubject = new BehaviorSubject<AgenceCIF[]>(this.loadAgences());
  public agences$: Observable<AgenceCIF[]> = this.agencesSubject.asObservable();

  private agentsSubject = new BehaviorSubject<AgentUser[]>(this.loadAgents());
  public agents$: Observable<AgentUser[]> = this.agentsSubject.asObservable();

  private currentUserSubject = new BehaviorSubject<AgentUser | null>(this.loadCurrentUser());
  public currentUser$: Observable<AgentUser | null> = this.currentUserSubject.asObservable();

  private trashSubject = new BehaviorSubject<CorbeilleItem[]>(this.loadTrash());
  public trash$: Observable<CorbeilleItem[]> = this.trashSubject.asObservable();

  isAuthenticated(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    return localStorage.getItem(SESSION_KEY) === 'authenticated';
  }

  login(emailOrMatricule: string, password: string): boolean {
    const query = (emailOrMatricule || '').trim().toLowerCase();
    const pass = (password || '').trim();

    if (!query || !pass) {
      return false;
    }

    const agents = this.getAgents();

    // Recherche de l'agent par email OU matricule (insensible à la casse)
    const agent = agents.find(a => 
      (a.email && a.email.toLowerCase() === query) || 
      (a.matricule && a.matricule.toLowerCase() === query)
    );

    // Si aucun agent ne correspond dans la base
    if (!agent) {
      // Compte Administrateur initial de secours
      if ((query === 'admin@cif.bf' || query === 'adm-001' || query === 'admin') && pass === 'admin123') {
        const defaultAdmin = this.addAgent({
          matricule: 'ADM-001',
          nom: 'Diallo',
          prenom: 'Amadou',
          email: 'admin@cif.bf',
          motDePasse: 'admin123',
          roleCode: 'ADMIN_SYSTEME',
          agence: 'Siège Principal CIF',
          telephone: '+226 25 30 00 00'
        });
        this.setCurrentUser(defaultAdmin.id);
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem(SESSION_KEY, 'authenticated');
        }
        return true;
      }
      return false; // Accès refusé
    }

    // Vérifier si le compte est actif
    if (agent.actif === false) {
      return false;
    }

    // Vérification stricte du mot de passe
    if (agent.motDePasse) {
      if (agent.motDePasse !== pass) {
        return false; // Mot de passe incorrect : accès refusé
      }
    } else {
      // Si l'agent n'avait pas encore de mot de passe, enregistrer le mot de passe saisi
      this.updateAgentPassword(agent.id, pass);
    }

    this.setCurrentUser(agent.id);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(SESSION_KEY, 'authenticated');
    }
    return true;
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
    }
    this.currentUserSubject.next(null);
  }

  // =========================================================================
  // GESTION DES RÔLES
  // =========================================================================
  private loadRoles(): AgentRole[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }
    const saved = localStorage.getItem(STORAGE_ROLES_KEY);
    if (!saved) {
      return [];
    }
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  public getRoles(): AgentRole[] {
    return this.rolesSubject.value;
  }

  public addRole(data: {
    code: string;
    label: string;
    description?: string;
  }): AgentRole {
    const codeClean = data.code.trim().toUpperCase().replace(/\s+/g, '_');

    const palettes = [
      'bg-[#e5f3f1] text-[#147c76] border-[#b9ded9]',
      'bg-[#e5f3f1] text-[#147c76] border-[#b9ded9]',
      'bg-[#e5f3f1] text-[#147c76] border-[#b9ded9]',
      'bg-emerald-50 text-emerald-700 border-emerald-200',
      'bg-amber-50 text-amber-700 border-amber-200',
      'bg-teal-50 text-teal-700 border-teal-200'
    ];
    const autoColor = palettes[this.getRoles().length % palettes.length];

    const newRole: AgentRole = {
      id: 'role-' + Date.now(),
      code: codeClean,
      label: data.label.trim(),
      description: (data.description || '').trim(),
      badgeColor: autoColor,
      dateCreation: new Date().toISOString().split('T')[0]
    };

    const updated = [...this.getRoles(), newRole];
    this.rolesSubject.next(updated);

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_ROLES_KEY, JSON.stringify(updated));
    }
    return newRole;
  }

  public updateRole(id: string, data: {
    label: string;
    code: string;
    description?: string;
  }): AgentRole | null {
    const roles = this.getRoles();
    const index = roles.findIndex(r => r.id === id);
    if (index === -1) return null;

    const existing = roles[index];
    const updatedRole: AgentRole = {
      ...existing,
      label: data.label.trim(),
      code: data.code.trim().toUpperCase().replace(/\s+/g, '_'),
      description: (data.description || '').trim()
    };

    const updated = [...roles];
    updated[index] = updatedRole;
    this.rolesSubject.next(updated);

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_ROLES_KEY, JSON.stringify(updated));
    }

    // Synchroniser le label pour les agents ayant ce rôle
    const agents = this.getAgents();
    let hasAgentChanges = false;
    const updatedAgents = agents.map(a => {
      if (a.roleCode === existing.code || a.roleCode === updatedRole.code) {
        hasAgentChanges = true;
        return {
          ...a,
          roleCode: updatedRole.code,
          roleLabel: updatedRole.label
        };
      }
      return a;
    });

    if (hasAgentChanges) {
      this.agentsSubject.next(updatedAgents);
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_AGENTS_KEY, JSON.stringify(updatedAgents));
      }
    }

    return updatedRole;
  }

  public deleteRole(id: string): boolean {
    const roles = this.getRoles();
    const role = roles.find(r => r.id === id);
    if (!role) return false;

    // Déplacer vers la corbeille
    this.addToTrash({
      type: 'ROLE',
      typeLabel: 'Rôle Agent',
      title: role.label,
      details: `Code: ${role.code} · ${role.description || 'Sans description'}`,
      data: role
    });

    const updated = roles.filter(r => r.id !== id);
    this.rolesSubject.next(updated);

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_ROLES_KEY, JSON.stringify(updated));
    }
    return true;
  }

  // =========================================================================
  // GESTION DES AGENCES CIF
  // =========================================================================
  private loadAgences(): AgenceCIF[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }
    const saved = localStorage.getItem(STORAGE_AGENCES_KEY);
    if (!saved) {
      return [];
    }
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  public getAgences(): AgenceCIF[] {
    return this.agencesSubject.value;
  }

  public addAgence(data: {
    nom: string;
    code: string;
    pays: string;
    ville: string;
    region: string;
    telephone?: string;
    adresse?: string;
  }): AgenceCIF {
    const codeClean = data.code.trim().toUpperCase().replace(/\s+/g, '_');
    const newAgence: AgenceCIF = {
      id: 'agence-' + Date.now(),
      nom: data.nom.trim(),
      code: codeClean,
      pays: (data.pays || '').trim(),
      ville: data.ville.trim(),
      region: data.region.trim(),
      telephone: (data.telephone || '').trim(),
      adresse: (data.adresse || '').trim(),
      dateCreation: new Date().toISOString().split('T')[0]
    };

    const updated = [...this.getAgences(), newAgence];
    this.agencesSubject.next(updated);

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_AGENCES_KEY, JSON.stringify(updated));
    }
    return newAgence;
  }

  public updateAgence(id: string, data: {
    nom: string;
    code: string;
    pays: string;
    ville: string;
    region: string;
    telephone?: string;
    adresse?: string;
  }): AgenceCIF | null {
    const agences = this.getAgences();
    const index = agences.findIndex(a => a.id === id);
    if (index === -1) return null;

    const existing = agences[index];
    const oldNom = existing.nom;

    const updatedAgence: AgenceCIF = {
      ...existing,
      nom: data.nom.trim(),
      code: data.code.trim().toUpperCase().replace(/\s+/g, '_'),
      pays: (data.pays || existing.pays || '').trim(),
      ville: data.ville.trim(),
      region: data.region.trim(),
      telephone: (data.telephone || '').trim(),
      adresse: (data.adresse || '').trim()
    };

    const updated = [...agences];
    updated[index] = updatedAgence;
    this.agencesSubject.next(updated);

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_AGENCES_KEY, JSON.stringify(updated));
    }

    // Si le nom a changé, synchroniser l'agence chez les agents
    if (oldNom !== updatedAgence.nom) {
      const agents = this.getAgents();
      let hasAgentChanges = false;
      const updatedAgents = agents.map(ag => {
        if (ag.agence === oldNom) {
          hasAgentChanges = true;
          return { ...ag, agence: updatedAgence.nom };
        }
        return ag;
      });
      if (hasAgentChanges) {
        this.agentsSubject.next(updatedAgents);
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(STORAGE_AGENTS_KEY, JSON.stringify(updatedAgents));
        }
      }
    }

    return updatedAgence;
  }

  public deleteAgence(id: string): boolean {
    const agences = this.getAgences();
    const agence = agences.find(a => a.id === id);
    if (!agence) return false;

    this.addToTrash({
      type: 'AGENCE',
      typeLabel: 'Agence CIF',
      title: agence.nom,
      details: `${agence.code} · ${agence.ville}, ${agence.region} (${agence.pays || ''})`,
      data: agence
    });

    const updated = agences.filter(a => a.id !== id);
    this.agencesSubject.next(updated);

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_AGENCES_KEY, JSON.stringify(updated));
    }
    return true;
  }

  // =========================================================================
  // GESTION DES AGENTS
  // =========================================================================
  private loadAgents(): AgentUser[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }
    const saved = localStorage.getItem(STORAGE_AGENTS_KEY);
    const defaultAdmin: AgentUser = {
      id: 'agt-admin-01',
      matricule: 'ADM-001',
      nom: 'Diallo',
      prenom: 'Amadou',
      email: 'admin@cif.bf',
      motDePasse: 'admin123',
      roleCode: 'ADMIN_SYSTEME',
      roleLabel: 'Administrateur Système',
      agence: 'Siège Principal CIF',
      dateCreation: '2026-01-15',
      telephone: '+226 25 30 00 00',
      avatarColor: 'from-[#147c76] to-[#147c76]',
      actif: true
    };

    if (!saved) {
      localStorage.setItem(STORAGE_AGENTS_KEY, JSON.stringify([defaultAdmin]));
      return [defaultAdmin];
    }
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      localStorage.setItem(STORAGE_AGENTS_KEY, JSON.stringify([defaultAdmin]));
      return [defaultAdmin];
    } catch {
      return [defaultAdmin];
    }
  }

  public getAgents(): AgentUser[] {
    return this.agentsSubject.value;
  }

  private loadCurrentUser(): AgentUser | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    const savedId = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
    const agents = this.getAgents();
    if (savedId) {
      const found = agents.find(a => a.id === savedId);
      if (found) return found;
    }
    return agents.length > 0 ? agents[0] : null;
  }

  public getCurrentUser(): AgentUser | null {
    return this.currentUserSubject.value;
  }

  public setCurrentUser(agentId: string): boolean {
    const agent = this.getAgents().find(a => a.id === agentId);
    if (agent) {
      this.currentUserSubject.next(agent);
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_CURRENT_USER_KEY, agentId);
      }
      return true;
    }
    return false;
  }

  public addAgent(data: {
    matricule: string;
    nom: string;
    prenom: string;
    email: string;
    motDePasse?: string;
    roleCode: string;
    agence: string;
    telephone?: string;
  }): AgentUser {
    const roles = this.getRoles();
    const role = roles.find(r => r.code === data.roleCode);
    const roleLabel = role ? role.label : (data.roleCode === 'ADMIN_SYSTEME' ? 'Administrateur Système' : data.roleCode);

    const gradients = [
      'from-[#147c76] to-[#147c76]',
      'from-emerald-600 to-teal-600',
      'from-[#147c76] to-[#0e625e]',
      'from-amber-500 to-orange-600',
      'from-[#147c76] to-[#147c76]'
    ];
    const autoAvatar = gradients[this.getAgents().length % gradients.length];

    const newAgent: AgentUser = {
      id: 'agt-' + Date.now(),
      matricule: data.matricule.trim().toUpperCase(),
      nom: data.nom.trim(),
      prenom: data.prenom.trim(),
      email: (data.email || '').trim(),
      motDePasse: (data.motDePasse || '').trim(),
      roleCode: data.roleCode,
      roleLabel: roleLabel,
      agence: data.agence,
      dateCreation: new Date().toISOString().split('T')[0],
      telephone: (data.telephone || '').trim(),
      avatarColor: autoAvatar,
      actif: true
    };

    const updated = [...this.getAgents(), newAgent];
    this.agentsSubject.next(updated);

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_AGENTS_KEY, JSON.stringify(updated));
    }

    if (!this.getCurrentUser()) {
      this.setCurrentUser(newAgent.id);
    }

    return newAgent;
  }

  public updateAgent(id: string, data: {
    matricule: string;
    nom: string;
    prenom: string;
    email: string;
    motDePasse?: string;
    roleCode: string;
    agence: string;
    telephone?: string;
  }): AgentUser | null {
    const agents = this.getAgents();
    const index = agents.findIndex(a => a.id === id);
    if (index === -1) return null;

    const roles = this.getRoles();
    const role = roles.find(r => r.code === data.roleCode);
    const roleLabel = role ? role.label : (data.roleCode === 'ADMIN_SYSTEME' ? 'Administrateur Système' : data.roleCode);

    const existing = agents[index];
    const updatedAgent: AgentUser = {
      ...existing,
      matricule: data.matricule.trim().toUpperCase(),
      nom: data.nom.trim(),
      prenom: data.prenom.trim(),
      email: (data.email || '').trim(),
      motDePasse: data.motDePasse ? data.motDePasse.trim() : existing.motDePasse,
      roleCode: data.roleCode,
      roleLabel: roleLabel,
      agence: data.agence,
      telephone: (data.telephone || '').trim()
    };

    const updated = [...agents];
    updated[index] = updatedAgent;
    this.agentsSubject.next(updated);

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_AGENTS_KEY, JSON.stringify(updated));
    }

    const current = this.getCurrentUser();
    if (current && current.id === id) {
      this.currentUserSubject.next(updatedAgent);
    }

    return updatedAgent;
  }

  public updateAgentPassword(agentId: string, newPass: string): boolean {
    const agents = this.getAgents();
    const index = agents.findIndex(a => a.id === agentId);
    if (index === -1) return false;

    agents[index] = { ...agents[index], motDePasse: newPass.trim() };
    const updated = [...agents];
    this.agentsSubject.next(updated);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_AGENTS_KEY, JSON.stringify(updated));
    }
    return true;
  }

  public deleteAgent(id: string): void {
    const agents = this.getAgents();
    const agent = agents.find(a => a.id === id);
    if (!agent) return;

    this.addToTrash({
      type: 'AGENT',
      typeLabel: 'Collaborateur',
      title: `${agent.prenom} ${agent.nom}`,
      details: `Matricule: ${agent.matricule} · ${agent.roleLabel} (${agent.agence})`,
      data: agent
    });

    const updated = agents.filter(a => a.id !== id);
    this.agentsSubject.next(updated);

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_AGENTS_KEY, JSON.stringify(updated));
    }

    const current = this.getCurrentUser();
    if (current && current.id === id) {
      const nextUser = updated.length > 0 ? updated[0] : null;
      this.currentUserSubject.next(nextUser);
      if (typeof window !== 'undefined' && window.localStorage) {
        if (nextUser) {
          localStorage.setItem(STORAGE_CURRENT_USER_KEY, nextUser.id);
        } else {
          localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
        }
      }
    }
  }

  // =========================================================================
  // GESTION DE LA CORBEILLE (Restauration & Purge après 30 jours)
  // =========================================================================
  private loadTrash(): CorbeilleItem[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }
    const saved = localStorage.getItem(STORAGE_TRASH_KEY);
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }

  public getTrash(): CorbeilleItem[] {
    return this.trashSubject.value;
  }

  public addToTrash(item: {
    type: 'ROLE' | 'AGENT' | 'AGENCE' | 'OBJET_CREDIT' | 'GARANTIE' | 'CATEGORIE';
    typeLabel: string;
    title: string;
    details: string;
    data: any;
  }): void {
    const trashItem: CorbeilleItem = {
      id: 'trash-' + Date.now(),
      type: item.type,
      typeLabel: item.typeLabel,
      title: item.title,
      details: item.details,
      data: item.data,
      dateSuppression: new Date().toISOString(),
      delaiJours: 30 // Rétention légale 30 jours
    };

    const updated = [trashItem, ...this.getTrash()];
    this.trashSubject.next(updated);

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_TRASH_KEY, JSON.stringify(updated));
    }
  }

  public restoreItem(trashId: string): boolean {
    const trash: CorbeilleItem[] = this.getTrash();
    const item = trash.find((t: CorbeilleItem) => t.id === trashId);
    if (!item) return false;

    // Restauration selon le type
    if (item.type === 'ROLE') {
      const restoredRole: AgentRole = item.data;
      const roles = this.getRoles();
      if (!roles.some(r => r.code === restoredRole.code)) {
        const updatedRoles = [...roles, restoredRole];
        this.rolesSubject.next(updatedRoles);
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(STORAGE_ROLES_KEY, JSON.stringify(updatedRoles));
        }
      }
    } else if (item.type === 'AGENT') {
      const restoredAgent: AgentUser = item.data;
      const agents = this.getAgents();
      if (!agents.some(a => a.id === restoredAgent.id)) {
        const updatedAgents = [...agents, restoredAgent];
        this.agentsSubject.next(updatedAgents);
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(STORAGE_AGENTS_KEY, JSON.stringify(updatedAgents));
        }
      }
    } else if (item.type === 'AGENCE') {
      const restoredAgence: AgenceCIF = item.data;
      const agences = this.getAgences();
      if (!agences.some(a => a.id === restoredAgence.id || a.code === restoredAgence.code)) {
        const updatedAgences = [...agences, restoredAgence];
        this.agencesSubject.next(updatedAgences);
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(STORAGE_AGENCES_KEY, JSON.stringify(updatedAgences));
        }
      }
    } else if (item.type === 'OBJET_CREDIT') {
      const OBJ_KEY = 'cif_settings_objets_credit_v2';
      try {
        const raw = localStorage.getItem(OBJ_KEY);
        const list = raw ? JSON.parse(raw) : [];
        if (!list.some((o: any) => o.id === item.data.id)) {
          list.unshift(item.data);
          localStorage.setItem(OBJ_KEY, JSON.stringify(list));
        }
      } catch (e) {
        console.error('Erreur restauration objet credit:', e);
      }
    } else if (item.type === 'GARANTIE') {
      const GAR_KEY = 'cif_settings_garanties_v2';
      try {
        const raw = localStorage.getItem(GAR_KEY);
        const list = raw ? JSON.parse(raw) : [];
        if (!list.some((g: any) => g.id === item.data.id)) {
          list.unshift(item.data);
          localStorage.setItem(GAR_KEY, JSON.stringify(list));
        }
      } catch (e) {
        console.error('Erreur restauration garantie:', e);
      }
    } else if (item.type === 'CATEGORIE') {
      const CAT_KEY = 'cif_settings_categories_v2';
      try {
        const raw = localStorage.getItem(CAT_KEY);
        const list = raw ? JSON.parse(raw) : [];
        if (!list.some((c: any) => c.id === item.data.id)) {
          list.unshift(item.data);
          localStorage.setItem(CAT_KEY, JSON.stringify(list));
        }
      } catch (e) {
        console.error('Erreur restauration categorie:', e);
      }
    }

    // Retirer de la corbeille
    const updatedTrash = trash.filter((t: CorbeilleItem) => t.id !== trashId);
    this.trashSubject.next(updatedTrash);

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_TRASH_KEY, JSON.stringify(updatedTrash));
    }
    return true;
  }

  public permanentDelete(trashId: string): void {
    const updated = this.getTrash().filter((t: CorbeilleItem) => t.id !== trashId);
    this.trashSubject.next(updated);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_TRASH_KEY, JSON.stringify(updated));
    }
  }

  public emptyTrash(): void {
    this.trashSubject.next([]);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(STORAGE_TRASH_KEY);
    }
  }
}
