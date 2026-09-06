package com.cif.microcredit.repository;

import com.cif.microcredit.model.CategorieCredit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CategorieCreditRepository extends JpaRepository<CategorieCredit, Long> {
    boolean existsByCode(String code);
    List<CategorieCredit> findByActifTrue();
}
