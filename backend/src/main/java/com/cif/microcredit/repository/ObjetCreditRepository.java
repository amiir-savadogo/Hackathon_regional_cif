package com.cif.microcredit.repository;

import com.cif.microcredit.model.ObjetCredit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ObjetCreditRepository extends JpaRepository<ObjetCredit, Long> {
    Optional<ObjetCredit> findByCode(String code);
    List<ObjetCredit> findByActifTrue();
    boolean existsByCode(String code);
}
