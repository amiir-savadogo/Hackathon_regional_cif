package com.cif.microcredit.repository;

import com.cif.microcredit.model.DemandeCredit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

/**
 * Repository JPA pour les demandes de crédit.
 * Spring génère automatiquement les requêtes SQL de base.
 */
public interface DemandeCreditRepository extends JpaRepository<DemandeCredit, Long> {
    List<DemandeCredit> findByClientIdOrderByDateCreationDesc(Long clientId);

    /**
     * Compte le nombre de demandes par statut directement en base
     * (agrégation SQL "GROUP BY", exécutée côté PostgreSQL) plutôt que
     * de charger toutes les lignes en mémoire pour les filtrer côté Java.
     * Chaque ligne du résultat est un tableau [statut, count].
     */
    @Query("SELECT d.statut, COUNT(d) FROM DemandeCredit d GROUP BY d.statut")
    List<Object[]> countByStatutGroup();
}
