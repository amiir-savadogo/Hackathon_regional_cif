package com.cif.microcredit.service;

import com.cif.microcredit.model.Agence;
import com.cif.microcredit.model.Client;
import com.cif.microcredit.model.ObjetCredit;
import com.cif.microcredit.model.TypeGarantie;
import com.cif.microcredit.repository.AgenceRepository;
import com.cif.microcredit.repository.ClientRepository;
import com.cif.microcredit.repository.ObjetCreditRepository;
import com.cif.microcredit.repository.TypeGarantieRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSeeder.class);

    @Autowired
    private ObjetCreditRepository objetCreditRepository;

    @Autowired
    private TypeGarantieRepository typeGarantieRepository;

    @Autowired
    private AgenceRepository agenceRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Override
    public void run(String... args) throws Exception {
        seedAgences();
        seedObjetsCredit();
        seedGaranties();
        seedClientsIfEmpty();
    }

    private void seedAgences() {
        if (agenceRepository.count() == 0) {
            log.info("Initialisation des Agences CIF dans la base PostgreSQL...");
            agenceRepository.saveAll(List.of(
                new Agence("AGC_OUAGA_CENTRE", "Caisse Populaire Ouaga Centre", "Burkina Faso", "Ouagadougou", "Centre", "+226 25 30 11 22", "Avenue Kwame Nkrumah, Secteur 4"),
                new Agence("AGC_BOBO_DIOULASSO", "Délégation Régionale Bobo", "Burkina Faso", "Bobo-Dioulasso", "Hauts-Bassins", "+226 20 97 05 40", "Boulevard de la Révolution"),
                new Agence("AGC_KOUDOUGOU", "Agence CIF Koudougou", "Burkina Faso", "Koudougou", "Centre-Ouest", "+226 25 44 02 18", "Place Maurice Yaméogo"),
                new Agence("AGC_OUAGA_GOUNGHIN", "Point de Service Gounghin", "Burkina Faso", "Ouagadougou", "Centre", "+226 25 34 22 10", "Rue 9.15 Gounghin"),
                new Agence("AGC_FADA_NGOURMA", "Caisse CIF Fada N'Gourma", "Burkina Faso", "Fada N'Gourma", "Est", "+226 24 77 01 90", "Avenue Yendabili")
            ));
        }
    }

    private void seedObjetsCredit() {
        // Objets de crédit configurables à 100% par les utilisateurs depuis le centre de paramétrage
    }

    private void seedGaranties() {
        // Types de garanties configurables à 100% par les utilisateurs depuis le centre de paramétrage
    }

    private void seedClientsIfEmpty() {
        if (clientRepository.count() < 50) {
            log.info("Chargement automatique des sociétaires depuis societaires.csv...");
            java.util.List<Client> clientsToSave = new java.util.ArrayList<>();
            
            // Recherche du fichier CSV dans plusieurs emplacements possibles
            java.io.File csvFile = new java.io.File("data/societaires.csv");
            if (!csvFile.exists()) csvFile = new java.io.File("../data/societaires.csv");
            if (!csvFile.exists()) csvFile = new java.io.File("backend/src/main/resources/data/societaires.csv");
            
            java.io.InputStream is = null;
            try {
                if (csvFile.exists()) {
                    is = new java.io.FileInputStream(csvFile);
                } else {
                    org.springframework.core.io.ClassPathResource resource = new org.springframework.core.io.ClassPathResource("data/societaires.csv");
                    if (resource.exists()) {
                        is = resource.getInputStream();
                    }
                }
                
                if (is != null) {
                    try (java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(is, java.nio.charset.StandardCharsets.UTF_8))) {
                        String line = reader.readLine(); // En-tête
                        if (line != null) {
                            String[] headers = parseCsvLine(line);
                            while ((line = reader.readLine()) != null) {
                                if (line.trim().isEmpty()) continue;
                                String[] values = parseCsvLine(line);
                                Client c = mapCsvToClient(headers, values);
                                if (c != null && c.getNumeroCnib() != null) {
                                    clientsToSave.add(c);
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Impossible de lire societaires.csv automatiquement : {}", e.getMessage());
            }

            if (!clientsToSave.isEmpty()) {
                // Sauvegarde par lots pour performance
                clientRepository.saveAll(clientsToSave);
                log.info("✅ {} sociétaires chargés avec succès dans PostgreSQL !", clientsToSave.size());
            } else {
                log.info("Création des 3 sociétaires de base par défaut...");
                createDefaultFallbackClients();
            }
        }
    }

    private String[] parseCsvLine(String line) {
        java.util.List<String> tokens = new java.util.ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;
        for (char ch : line.toCharArray()) {
            if (ch == '"') {
                inQuotes = !inQuotes;
            } else if (ch == ',' && !inQuotes) {
                tokens.add(sb.toString().trim());
                sb.setLength(0);
            } else {
                sb.append(ch);
            }
        }
        tokens.add(sb.toString().trim());
        return tokens.toArray(new String[0]);
    }

    private Client mapCsvToClient(String[] headers, String[] values) {
        java.util.Map<String, String> map = new java.util.HashMap<>();
        for (int i = 0; i < Math.min(headers.length, values.length); i++) {
            map.put(headers[i].trim().toLowerCase(), values[i].trim());
        }

        String cnib = getVal(map, "n° cnib", "cnib", "numerocnib");
        if (cnib == null || cnib.isEmpty()) return null;

        Client c = new Client();
        c.setNumeroCnib(cnib);
        c.setNumeroCompte(getVal(map, "numéro compte", "numero compte", "compte"));
        c.setTypeCompte(getValDefault(map, "compte épargne sociétaire", "type de compte", "type compte"));
        c.setStatutCompte(getValDefault(map, "Actif", "statut du compte", "statut compte"));
        c.setPartsSocialesFcfa(parseDouble(getVal(map, "parts sociales (fcfa)", "parts sociales"), 10000.0));
        c.setNom(getValDefault(map, "Nom", "nom"));
        c.setPrenom(getValDefault(map, "Prénom", "prénom", "prenom"));
        c.setDateNaissance(getValDefault(map, "1990-01-01", "date de naissance", "date naissance"));
        c.setAge(parseInt(getVal(map, "âge", "age"), 30));
        c.setDateExpirationCnib(getValDefault(map, "2035-12-31", "date expiration cnib", "date expiration"));
        c.setTelephone(getValDefault(map, "+226 70 00 00 00", "contact téléphonique", "telephone", "téléphone"));
        c.setEmail(getValDefault(map, "contact@cif-client.bf", "email"));
        c.setPays(getValDefault(map, "Burkina Faso", "pays"));
        c.setRegion(getValDefault(map, "Centre", "région", "region"));
        c.setVille(getValDefault(map, "Ouagadougou", "ville"));
        c.setAdresse(getValDefault(map, "Ouagadougou", "adresse complète", "adresse"));
        c.setTypeLogement(getValDefault(map, "Locataire", "type de logement", "logement"));
        c.setAgence(getValDefault(map, "Ouaga 1 - Siège Principal", "agence cif", "agence"));
        c.setSituationMatrimoniale(getValDefault(map, "Marié(e)", "situation matrimoniale"));
        c.setNombrePersonnesACharge(parseInt(getVal(map, "personnes en charge", "personnes a charge"), 2));
        c.setNiveauEducation(getValDefault(map, "Secondaire", "niveau d'éducation", "niveau education"));
        c.setActivité(getValDefault(map, "Commerce", "activité", "activite"));
        c.setSecteurActivite(getValDefault(map, "Commerce général", "secteur d'activité", "secteur activite"));
        c.setAncienneteActiviteAnnees(parseDouble(getVal(map, "ancienneté activité (années)", "anciennete activite"), 3.0));
        c.setAncienneteCooperativeMois(parseInt(getVal(map, "ancienneté cif (mois)", "anciennete cif"), 12));
        c.setSoldeEpargneActuelFcfa(parseDouble(getVal(map, "solde épargne actuel (fcfa)", "solde epargne"), 0.0));
        c.setSexe(getValDefault(map, "Homme", "genre", "sexe"));
        c.setZone(getValDefault(map, "Urbaine", "zone"));

        return c;
    }

    private String getVal(java.util.Map<String, String> map, String... keys) {
        for (String k : keys) {
            String v = map.get(k.toLowerCase());
            if (v != null && !v.trim().isEmpty()) return v.trim();
        }
        return null;
    }

    private String getValDefault(java.util.Map<String, String> map, String defaultVal, String... keys) {
        String v = getVal(map, keys);
        return v != null ? v : defaultVal;
    }

    private int parseInt(String val, int defaultVal) {
        if (val == null) return defaultVal;
        try {
            return Integer.parseInt(val.replaceAll("[^0-9\\-]", ""));
        } catch (Exception e) {
            return defaultVal;
        }
    }

    private double parseDouble(String val, double defaultVal) {
        if (val == null) return defaultVal;
        try {
            return Double.parseDouble(val.replace(",", ".").replaceAll("[^0-9\\.\\-]", ""));
        } catch (Exception e) {
            return defaultVal;
        }
    }

    private void createDefaultFallbackClients() {
        Client c1 = new Client();
        c1.setNumeroCnib("B43345047");
        c1.setDateExpirationCnib("2033-04-09");
        c1.setNumeroCompte("CPT-0001");
        c1.setTypeCompte("Compte Épargne Sociétaire");
        c1.setStatutCompte("Actif");
        c1.setPartsSocialesFcfa(50000.0);
        c1.setAgence("Caisse Populaire Ouaga Centre");
        c1.setAncienneteCooperativeMois(66);
        c1.setSoldeEpargneActuelFcfa(459000.0);
        c1.setNom("Ouédraogo");
        c1.setPrenom("Kadiatou");
        c1.setAge(36);
        c1.setDateNaissance("1990-03-12");
        c1.setTelephone("+226 07 83 80 72");
        c1.setEmail("kadiatou.ouedraogo@cif.bf");
        c1.setPays("Burkina Faso");
        c1.setRegion("Centre");
        c1.setVille("Ouagadougou");
        c1.setAdresse("Saaba, Secteur 19, Rue 18");
        c1.setTypeLogement("Locataire");
        c1.setSecteurActivite("Commerce");
        c1.setActivite("Commerce d'aliments et condiments");
        c1.setAncienneteActiviteAnnees(7.0);
        c1.setSexe("Femme");
        c1.setZone("Urbaine");
        c1.setSituationMatrimoniale("Divorcé(e)");
        c1.setNiveauEducation("Primaire");
        c1.setNombrePersonnesACharge(5);

        Client c2 = new Client();
        c2.setNumeroCnib("B51923646");
        c2.setDateExpirationCnib("2031-11-20");
        c2.setNumeroCompte("CPT-0002");
        c2.setTypeCompte("Compte Épargne & Crédit");
        c2.setStatutCompte("Actif");
        c2.setPartsSocialesFcfa(75000.0);
        c2.setAgence("Délégation Régionale Bobo");
        c2.setAncienneteCooperativeMois(48);
        c2.setSoldeEpargneActuelFcfa(820000.0);
        c2.setNom("Traoré");
        c2.setPrenom("Mamadou");
        c2.setAge(42);
        c2.setDateNaissance("1984-07-24");
        c2.setTelephone("+226 70 12 34 56");
        c2.setEmail("mamadou.traore@cif.bf");
        c2.setPays("Burkina Faso");
        c2.setRegion("Hauts-Bassins");
        c2.setVille("Bobo-Dioulasso");
        c2.setAdresse("Accart-Ville, Rue 12");
        c2.setTypeLogement("Propriétaire");
        c2.setSecteurActivite("Agriculture");
        c2.setActivite("Culture maraîchère et maïs");
        c2.setAncienneteActiviteAnnees(12.0);
        c2.setSexe("Homme");
        c2.setZone("Semi-urbaine");
        c2.setSituationMatrimoniale("Marié(e)");
        c2.setNiveauEducation("Secondaire");
        c2.setNombrePersonnesACharge(4);

        clientRepository.saveAll(List.of(c1, c2));
    }
}
