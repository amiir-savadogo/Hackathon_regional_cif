package com.cif.microcredit.repository;

import com.cif.microcredit.model.NatureJuridique;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NatureJuridiqueRepository extends JpaRepository<NatureJuridique, Long> {
    boolean existsByCode(String code);
    List<NatureJuridique> findByActifTrue();
}
