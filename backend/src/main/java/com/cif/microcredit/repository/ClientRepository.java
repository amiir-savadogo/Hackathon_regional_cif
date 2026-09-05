package com.cif.microcredit.repository;

import com.cif.microcredit.model.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {

    boolean existsByNomIgnoreCaseAndPrenomIgnoreCase(String nom, String prenom);

    Optional<Client> findByNumeroCnibIgnoreCase(String numeroCnib);

    Optional<Client> findByNumeroCompteIgnoreCase(String numeroCompte);

    @Query("SELECT c FROM Client c WHERE " +
           "LOWER(c.numeroCnib) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.nom) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.prenom) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.numeroCompte) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.telephone) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Client> searchClients(@Param("query") String query);
}

