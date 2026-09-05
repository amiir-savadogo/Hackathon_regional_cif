package com.cif.microcredit.controller;

import com.cif.microcredit.model.Agence;
import com.cif.microcredit.model.ObjetCredit;
import com.cif.microcredit.model.TypeGarantie;
import com.cif.microcredit.repository.AgenceRepository;
import com.cif.microcredit.repository.ObjetCreditRepository;
import com.cif.microcredit.repository.TypeGarantieRepository;
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
        if (updates.getTypeGarantie() != null) existing.setTypeGarantie(updates.getTypeGarantie());
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
