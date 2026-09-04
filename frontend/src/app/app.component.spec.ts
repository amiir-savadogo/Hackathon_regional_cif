import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the "CréditSûr WA" brand name in the header', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('CréditSûr WA');
  });

  it('should no longer reference the stale "Moteur IA actif" percentage label', () => {
    // Garde-fou anti-régression : cf. l'ancien "XGBoost ML v1.0 (88.6%)" /
    // "Moteur IA actif (88.6%)" laissés dans le template après le passage à un
    // pipeline à 5 modèles - ce test échoue si un pourcentage codé en dur
    // (lié à un ancien modèle) revient dans le template.
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('88.6');
    expect(compiled.textContent).not.toContain('XGBoost');
  });
});
