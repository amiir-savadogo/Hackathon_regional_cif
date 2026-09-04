package com.cif.microcredit.repository;

import com.cif.microcredit.model.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {

    // Remplace l'ancien contrôle anti-doublon qui chargeait TOUS les clients en
    // mémoire (clientRepository.findAll().stream()...) pour les comparer un par
    // un côté Java. Cette méthode laisse PostgreSQL faire la recherche via une
    // requête indexable, ce qui reste rapide même avec un grand nombre de clients.
    boolean existsByNomIgnoreCaseAndPrenomIgnoreCase(String nom, String prenom);
}
