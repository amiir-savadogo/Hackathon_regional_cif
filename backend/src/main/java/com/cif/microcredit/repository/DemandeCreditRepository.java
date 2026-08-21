package com.cif.microcredit.repository;

import com.cif.microcredit.model.DemandeCredit;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

/**
 * Repository JPA pour les demandes de crédit.
 * Spring génère automatiquement les requêtes SQL de base.
 */
public interface DemandeCreditRepository extends JpaRepository<DemandeCredit, Long> {
    List<DemandeCredit> findByClientIdOrderByDateCreationDesc(Long clientId);
}
