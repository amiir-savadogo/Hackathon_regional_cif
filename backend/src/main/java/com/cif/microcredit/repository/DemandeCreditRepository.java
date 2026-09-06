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
     * Toutes les demandes, plus récentes d'abord, avec le client déjà chargé
     * (JOIN FETCH) : évite le N+1 et la LazyInitializationException lors de la
     * sérialisation JSON de `demande.client` pour l'endpoint /api/demandes.
     */
    @Query("SELECT d FROM DemandeCredit d JOIN FETCH d.client ORDER BY d.dateCreation DESC")
    List<DemandeCredit> findAllWithClient();

    /**
     * Compte le nombre de demandes par statut directement en base
     * (agrégation SQL "GROUP BY", exécutée côté PostgreSQL) plutôt que
     * de charger toutes les lignes en mémoire pour les filtrer côté Java.
     * Chaque ligne du résultat est un tableau [statut, count].
     */
    @Query("SELECT d.statut, COUNT(d) FROM DemandeCredit d GROUP BY d.statut")
    List<Object[]> countByStatutGroup();
}
