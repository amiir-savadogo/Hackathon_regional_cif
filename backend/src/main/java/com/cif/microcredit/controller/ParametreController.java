package com.cif.microcredit.controller;

import com.cif.microcredit.model.Agence;
import com.cif.microcredit.model.CategorieCredit;
import com.cif.microcredit.model.ObjetCredit;
import com.cif.microcredit.model.TypeGarantie;
import com.cif.microcredit.repository.AgenceRepository;
import com.cif.microcredit.repository.CategorieCreditRepository;
import com.cif.microcredit.repository.ObjetCreditRepository;
import com.cif.microcredit.repository.TypeGarantieRepository;
import com.cif.microcredit.model.NatureJuridique;
import com.cif.microcredit.repository.NatureJuridiqueRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ParametreController {

    @Autowired
    private ObjetCreditRepository objetCreditRepository;

    @Autowired
    private TypeGarantieRepository typeGarantieRepository;

    @Autowired
    private AgenceRepository agenceRepository;

    @Autowired
    private NatureJuridiqueRepository natureJuridiqueRepository;

    @Autowired
    private CategorieCreditRepository categorieCreditRepository;

    // =========================================================================
    // CATÉGORIES DE CRÉDIT
    // =========================================================================
    @GetMapping("/categories-credit")
    public ResponseEntity<List<CategorieCredit>> getAllCategoriesCredit(@RequestParam(required = false) Boolean actifOnly) {
        if (Boolean.TRUE.equals(actifOnly)) {
            return ResponseEntity.ok(categorieCreditRepository.findByActifTrue());
        }
        return ResponseEntity.ok(categorieCreditRepository.findAll());
    }

    @PostMapping("/categories-credit")
    public ResponseEntity<?> createCategorieCredit(@Valid @RequestBody CategorieCredit categorie) {
        if (categorieCreditRepository.existsByCode(categorie.getCode())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(java.util.Map.of("erreur", "Une catégorie avec ce code existe déjà."));
        }
        categorie.setSysteme(false);
        return ResponseEntity.status(HttpStatus.CREATED).body(categorieCreditRepository.save(categorie));
    }

    @PutMapping("/categories-credit/{id}")
    public ResponseEntity<?> updateCategorieCredit(@PathVariable Long id, @RequestBody CategorieCredit updates) {
        Optional<CategorieCredit> opt = categorieCreditRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        CategorieCredit existing = opt.get();
        // Une entrée "systeme" alimente le modèle IA : label figé, seul l'état actif est modifiable.
        if (!existing.isSysteme() && updates.getLabel() != null) existing.setLabel(updates.getLabel());
        if (updates.getDescription() != null) existing.setDescription(updates.getDescription());
        if (updates.getTauxInteretMin() != null) existing.setTauxInteretMin(updates.getTauxInteretMin());
        if (updates.getDureeMaxMois() != null) existing.setDureeMaxMois(updates.getDureeMaxMois());
        existing.setActif(updates.isActif());
        return ResponseEntity.ok(categorieCreditRepository.save(existing));
    }

    @DeleteMapping("/categories-credit/{id}")
    public ResponseEntity<?> deleteCategorieCredit(@PathVariable Long id) {
        Optional<CategorieCredit> opt = categorieCreditRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        if (opt.get().isSysteme()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(java.util.Map.of("erreur", "Catégorie système (liée au modèle IA) : non supprimable."));
        }
        categorieCreditRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // OBJETS DE CRÉDIT
    // =========================================================================
    @GetMapping("/objets-credit")
    public ResponseEntity<List<ObjetCredit>> getAllObjetsCredit(@RequestParam(required = false) Boolean actifOnly) {
        if (Boolean.TRUE.equals(actifOnly)) {
            return ResponseEntity.ok(objetCreditRepository.findByActifTrue());
        }
        return ResponseEntity.ok(objetCreditRepository.findAll());
    }

    @PostMapping("/objets-credit")
    public ResponseEntity<?> createObjetCredit(@Valid @RequestBody ObjetCredit objet) {
        if (objetCreditRepository.existsByCode(objet.getCode())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(java.util.Map.of("erreur", "Un objet de crédit avec ce code existe déjà."));
        }
        ObjetCredit saved = objetCreditRepository.save(objet);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/objets-credit/{id}")
    public ResponseEntity<?> updateObjetCredit(@PathVariable Long id, @RequestBody ObjetCredit updates) {
        Optional<ObjetCredit> opt = objetCreditRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        ObjetCredit existing = opt.get();
        if (updates.getLabel() != null) existing.setLabel(updates.getLabel());
        if (updates.getCategorie() != null) existing.setCategorie(updates.getCategorie());
        if (updates.getDescription() != null) existing.setDescription(updates.getDescription());
        if (updates.getTauxInteretMin() != null) existing.setTauxInteretMin(updates.getTauxInteretMin());
        if (updates.getDureeMaxMois() != null) existing.setDureeMaxMois(updates.getDureeMaxMois());
        existing.setActif(updates.isActif());

        ObjetCredit saved = objetCreditRepository.save(existing);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/objets-credit/{id}")
    public ResponseEntity<?> deleteObjetCredit(@PathVariable Long id) {
        if (!objetCreditRepository.existsById(id)) return ResponseEntity.notFound().build();
        objetCreditRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // NATURES JURIDIQUES
    // =========================================================================
    @GetMapping("/natures-juridiques")
    public ResponseEntity<List<NatureJuridique>> getAllNaturesJuridiques(@RequestParam(required = false) Boolean actifOnly) {
        if (Boolean.TRUE.equals(actifOnly)) {
            return ResponseEntity.ok(natureJuridiqueRepository.findByActifTrue());
        }
        return ResponseEntity.ok(natureJuridiqueRepository.findAll());
    }

    @PostMapping("/natures-juridiques")
    public ResponseEntity<?> createNatureJuridique(@Valid @RequestBody NatureJuridique nature) {
        if (natureJuridiqueRepository.existsByCode(nature.getCode())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(java.util.Map.of("erreur", "Une nature juridique avec ce code existe déjà."));
        }
        NatureJuridique saved = natureJuridiqueRepository.save(nature);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/natures-juridiques/{id}")
    public ResponseEntity<?> updateNatureJuridique(@PathVariable Long id, @RequestBody NatureJuridique updates) {
        Optional<NatureJuridique> opt = natureJuridiqueRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        NatureJuridique existing = opt.get();
        if (updates.getLabel() != null) existing.setLabel(updates.getLabel());
        if (updates.getDescription() != null) existing.setDescription(updates.getDescription());
        existing.setNecessiteNotaire(updates.isNecessiteNotaire());
        existing.setFraisEnregistrement(updates.isFraisEnregistrement());
        existing.setActif(updates.isActif());

        NatureJuridique saved = natureJuridiqueRepository.save(existing);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/natures-juridiques/{id}")
    public ResponseEntity<?> deleteNatureJuridique(@PathVariable Long id) {
        if (!natureJuridiqueRepository.existsById(id)) return ResponseEntity.notFound().build();
        natureJuridiqueRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // TYPES DE GARANTIES
    // =========================================================================
    @GetMapping("/garanties")
    public ResponseEntity<List<TypeGarantie>> getAllGaranties(@RequestParam(required = false) Boolean actifOnly) {
        if (Boolean.TRUE.equals(actifOnly)) {
            return ResponseEntity.ok(typeGarantieRepository.findByActifTrue());
        }
        return ResponseEntity.ok(typeGarantieRepository.findAll());
    }

    @PostMapping("/garanties")
    public ResponseEntity<?> createGarantie(@Valid @RequestBody TypeGarantie garantie) {
        if (typeGarantieRepository.existsByCode(garantie.getCode())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(java.util.Map.of("erreur", "Un type de garantie avec ce code existe déjà."));
        }
        TypeGarantie saved = typeGarantieRepository.save(garantie);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/garanties/{id}")
    public ResponseEntity<?> updateGarantie(@PathVariable Long id, @RequestBody TypeGarantie updates) {
        Optional<TypeGarantie> opt = typeGarantieRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        TypeGarantie existing = opt.get();
        if (updates.getLabel() != null) existing.setLabel(updates.getLabel());
        if (updates.getNatureJuridiqueId() != null) existing.setNatureJuridiqueId(updates.getNatureJuridiqueId());
        if (updates.getTauxCouvertureRecommande() != null) existing.setTauxCouvertureRecommande(updates.getTauxCouvertureRecommande());
        if (updates.getDescription() != null) existing.setDescription(updates.getDescription());
        existing.setExigeDocument(updates.isExigeDocument());
        existing.setActif(updates.isActif());

        TypeGarantie saved = typeGarantieRepository.save(existing);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/garanties/{id}")
    public ResponseEntity<?> deleteGarantie(@PathVariable Long id) {
        if (!typeGarantieRepository.existsById(id)) return ResponseEntity.notFound().build();
        typeGarantieRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // =========================================================================
    // AGENCES CIF
    // =========================================================================
    @GetMapping("/agences")
    public ResponseEntity<List<Agence>> getAllAgences() {
        return ResponseEntity.ok(agenceRepository.findAll());
    }

    @PostMapping("/agences")
    public ResponseEntity<?> createAgence(@Valid @RequestBody Agence agence) {
        if (agenceRepository.existsByCode(agence.getCode())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(java.util.Map.of("erreur", "Une agence avec ce code existe déjà."));
        }
        Agence saved = agenceRepository.save(agence);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/agences/{id}")
    public ResponseEntity<?> updateAgence(@PathVariable Long id, @RequestBody Agence updates) {
        Optional<Agence> opt = agenceRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        Agence existing = opt.get();
        if (updates.getNom() != null) existing.setNom(updates.getNom());
        if (updates.getPays() != null) existing.setPays(updates.getPays());
        if (updates.getVille() != null) existing.setVille(updates.getVille());
        if (updates.getRegion() != null) existing.setRegion(updates.getRegion());
        if (updates.getTelephone() != null) existing.setTelephone(updates.getTelephone());
        if (updates.getAdresse() != null) existing.setAdresse(updates.getAdresse());

        Agence saved = agenceRepository.save(existing);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/agences/{id}")
    public ResponseEntity<?> deleteAgence(@PathVariable Long id) {
        if (!agenceRepository.existsById(id)) return ResponseEntity.notFound().build();
        agenceRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
