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

    // --- Dossiers actifs (corbeille exclue) ---
    List<DemandeCredit> findByClientIdAndSupprimeFalseOrderByDateCreationDesc(Long clientId);

    /**
     * Toutes les demandes actives, plus récentes d'abord, avec le client déjà
     * chargé (JOIN FETCH) : évite le N+1 et la LazyInitializationException lors
     * de la sérialisation JSON de `demande.client` pour l'endpoint /api/demandes.
     */
    @Query("SELECT d FROM DemandeCredit d JOIN FETCH d.client WHERE d.supprime = false ORDER BY d.dateCreation DESC")
    List<DemandeCredit> findAllActivesWithClient();

    @Query("SELECT d.statut, COUNT(d) FROM DemandeCredit d WHERE d.supprime = false GROUP BY d.statut")
    List<Object[]> countByStatutGroup();

    // --- Corbeille ---
    @Query("SELECT d FROM DemandeCredit d JOIN FETCH d.client WHERE d.supprime = true ORDER BY d.dateSuppression DESC")
    List<DemandeCredit> findCorbeilleWithClient();
}
