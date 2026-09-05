package com.cif.microcredit.repository;

import com.cif.microcredit.model.Agence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AgenceRepository extends JpaRepository<Agence, Long> {
    Optional<Agence> findByCode(String code);
    boolean existsByCode(String code);
}
