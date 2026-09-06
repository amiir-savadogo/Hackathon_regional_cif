package com.cif.microcredit.service;

import com.cif.microcredit.model.Agence;
import com.cif.microcredit.model.CategorieCredit;
import com.cif.microcredit.model.Client;
import com.cif.microcredit.model.NatureJuridique;
import com.cif.microcredit.model.ObjetCredit;
import com.cif.microcredit.model.TypeGarantie;
import com.cif.microcredit.repository.AgenceRepository;
import com.cif.microcredit.repository.CategorieCreditRepository;
import com.cif.microcredit.repository.ClientRepository;
import com.cif.microcredit.repository.NatureJuridiqueRepository;
import com.cif.microcredit.repository.ObjetCreditRepository;
import com.cif.microcredit.repository.TypeGarantieRepository;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

/**
 * Amorçage de la base PostgreSQL au démarrage (idempotent : chaque bloc ne
 * s'exécute que si sa table est vide).
 *
 *  - Agences CIF de référence
 *  - Natures juridiques des garanties
 *  - Sociétaires : chargés depuis data/societaires.json (jeu synthétique UEMOA),
 *    avec repli sur quelques profils codés en dur si le fichier est absent.
 *
 * Les objets de crédit et les types de garantie restent volontairement vides :
 * ils sont 100 % paramétrables par les utilisateurs depuis le centre de
 * paramétrage du frontend.
 */
@Component
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSeeder.class);

    @Autowired
    private AgenceRepository agenceRepository;

    @Autowired
    private NatureJuridiqueRepository natureJuridiqueRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private CategorieCreditRepository categorieCreditRepository;

    @Autowired
    private ObjetCreditRepository objetCreditRepository;

    @Autowired
    private TypeGarantieRepository typeGarantieRepository;

    @Override
    public void run(String... args) throws Exception {
        seedAgences();
        seedNaturesJuridiques();
        seedCatalogue();
        seedClientsIfEmpty();
    }

    /**
     * Catégories / objets / garanties : chargés depuis data/catalogue_credit.json
     * (exporté par scripts/export_catalogue.py, source de vérité partagée avec le
     * générateur). Repli sur un jeu minimal si le fichier est absent. Ne s'exécute
     * que sur des tables vides.
     */
    private void seedCatalogue() {
        boolean vide = categorieCreditRepository.count() == 0
                && objetCreditRepository.count() == 0
                && typeGarantieRepository.count() == 0;
        if (!vide) {
            return;
        }

        JsonNode payload = lireCatalogueJson();
        if (payload != null) {
            List<CategorieCredit> cats = new ArrayList<>();
            for (JsonNode n : payload.path("categories")) {
                CategorieCredit c = new CategorieCredit(
                        n.path("code").asText(), n.path("label").asText(),
                        n.path("tauxInteretMin").isNumber() ? n.get("tauxInteretMin").asDouble() : null,
                        n.path("dureeMaxMois").isNumber() ? n.get("dureeMaxMois").asInt() : null,
                        n.path("systeme").asBoolean(true));
                cats.add(c);
            }
            List<ObjetCredit> objets = new ArrayList<>();
            for (JsonNode n : payload.path("objets")) {
                ObjetCredit o = new ObjetCredit();
                o.setCode(n.path("code").asText());
                o.setLabel(n.path("label").asText());
                o.setCategorie(n.path("categorie").asText());
                if (n.path("tauxInteretMin").isNumber()) o.setTauxInteretMin(n.get("tauxInteretMin").asDouble());
                if (n.path("dureeMaxMois").isNumber()) o.setDureeMaxMois(n.get("dureeMaxMois").asInt());
                o.setActif(true);
                o.setSysteme(n.path("systeme").asBoolean(true));
                objets.add(o);
            }
            List<TypeGarantie> garanties = new ArrayList<>();
            for (JsonNode n : payload.path("garanties")) {
                TypeGarantie g = new TypeGarantie();
                g.setCode(n.path("code").asText());
                g.setLabel(n.path("label").asText());
                if (n.path("tauxCouvertureRecommande").isNumber())
                    g.setTauxCouvertureRecommande(n.get("tauxCouvertureRecommande").asInt());
                g.setActif(true);
                g.setSysteme(n.path("systeme").asBoolean(true));
                garanties.add(g);
            }
            categorieCreditRepository.saveAll(cats);
            objetCreditRepository.saveAll(objets);
            typeGarantieRepository.saveAll(garanties);
            log.info("Catalogue seedé : {} catégories, {} objets, {} garanties.",
                    cats.size(), objets.size(), garanties.size());
            return;
        }

        log.info("catalogue_credit.json absent - seed minimal des catégories et garanties.");
        String[] categoriesMin = {
            "Crédit agricole - campagne", "Crédit élevage", "Crédit commerce - fonds de roulement",
            "Crédit artisanat - production", "Crédit transport", "Crédit équipement - investissement",
            "Crédit habitat - amélioration logement", "Crédit consommation", "Crédit scolaire - éducation",
            "Crédit santé", "Crédit social - événementiel", "Crédit salarié - fonctionnaire",
            "Crédit groupe solidaire",
        };
        List<CategorieCredit> cats = new ArrayList<>();
        for (String label : categoriesMin) {
            cats.add(new CategorieCredit(codeDepuisLabel(label), label, 10.0, 24, true));
        }
        categorieCreditRepository.saveAll(cats);

        List<TypeGarantie> garanties = new ArrayList<>();
        for (String label : new String[]{"Caution solidaire", "Bien matériel", "Aval d'un tiers", "Aucune"}) {
            TypeGarantie g = new TypeGarantie();
            g.setCode(codeDepuisLabel(label));
            g.setLabel(label);
            g.setTauxCouvertureRecommande(100);
            g.setActif(true);
            g.setSysteme(true);
            garanties.add(g);
        }
        typeGarantieRepository.saveAll(garanties);
    }

    private static String codeDepuisLabel(String label) {
        String s = java.text.Normalizer.normalize(label, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "").toUpperCase().replaceAll("[^A-Z0-9]+", "_");
        return s.replaceAll("^_+|_+$", "");
    }

    private JsonNode lireCatalogueJson() {
        try {
            InputStream is = null;
            ClassPathResource resource = new ClassPathResource("data/catalogue_credit.json");
            if (resource.exists()) {
                is = resource.getInputStream();
            } else {
                for (String p : new String[]{"data/catalogue_credit.json", "../data/catalogue_credit.json"}) {
                    File f = new File(p);
                    if (f.exists()) { is = new FileInputStream(f); break; }
                }
            }
            if (is == null) return null;
            try (InputStream in = is) {
                return new ObjectMapper().readTree(in);
            }
        } catch (Exception e) {
            log.warn("Lecture de catalogue_credit.json impossible : {}", e.getMessage());
            return null;
        }
    }

    private void seedAgences() {
        if (agenceRepository.count() > 0) {
            return;
        }
        log.info("Initialisation des agences dans PostgreSQL...");
        agenceRepository.saveAll(List.of(
            new Agence("AGC_OUAGA_CENTRE", "Caisse Populaire Ouaga Centre", "Burkina Faso", "Ouagadougou", "Centre", "+226 25 30 11 22", "Avenue Kwame Nkrumah, Secteur 4"),
            new Agence("AGC_BOBO_DIOULASSO", "Délégation Régionale Bobo", "Burkina Faso", "Bobo-Dioulasso", "Hauts-Bassins", "+226 20 97 05 40", "Boulevard de la Révolution"),
            new Agence("AGC_KOUDOUGOU", "Agence de Koudougou", "Burkina Faso", "Koudougou", "Centre-Ouest", "+226 25 44 02 18", "Place Maurice Yaméogo"),
            new Agence("AGC_OUAGA_GOUNGHIN", "Point de Service Gounghin", "Burkina Faso", "Ouagadougou", "Centre", "+226 25 34 22 10", "Rue 9.15 Gounghin"),
            new Agence("AGC_FADA_NGOURMA", "Caisse de Fada N'Gourma", "Burkina Faso", "Fada N'Gourma", "Est", "+226 24 77 01 90", "Avenue Yendabili")
        ));
    }

    private void seedNaturesJuridiques() {
        if (natureJuridiqueRepository.count() > 0) {
            return;
        }
        log.info("Initialisation des Natures Juridiques par défaut...");
        natureJuridiqueRepository.saveAll(List.of(
            new NatureJuridique("NAT_ACTE_NOTARIE", "Acte Notarié",
                    "Acte rédigé par un notaire, obligatoire pour l'immobilier.", true, true, true),
            new NatureJuridique("NAT_SOUS_SEING", "Sous Seing Privé",
                    "Contrat signé entre parties sans notaire.", false, true, true),
            new NatureJuridique("NAT_VERBALE", "Convention Verbale",
                    "Accord oral, difficile à prouver, risque élevé.", false, false, true),
            new NatureJuridique("NAT_JUDICIAIRE", "Hypothèque Judiciaire",
                    "Imposée par une décision de justice.", false, true, true),
            new NatureJuridique("NAT_CAUTION", "Caution Solidaire",
                    "Engagement écrit d'un tiers à payer en cas de défaut.", false, false, true)
        ));
    }

    private void seedClientsIfEmpty() {
        if (clientRepository.count() >= 50) {
            return;
        }

        List<Client> clients = chargerSocietairesDepuisJson();
        if (!clients.isEmpty()) {
            clientRepository.saveAll(clients);
            log.info("{} sociétaires chargés depuis societaires.json dans PostgreSQL.", clients.size());
        } else {
            log.info("societaires.json introuvable - création des sociétaires de démonstration par défaut.");
            createDefaultFallbackClients();
        }
    }

    /**
     * Lit data/societaires.json (classpath en priorité, puis quelques chemins
     * relatifs pour l'exécution locale) et le mappe vers l'entité Client. Les
     * champs id / dateCreation / demandes du JSON sont ignorés : l'id est
     * régénéré par la base, dateCreation par @PrePersist.
     */
    private List<Client> chargerSocietairesDepuisJson() {
        List<Client> result = new ArrayList<>();
        try (InputStream is = ouvrirSocietairesJson()) {
            if (is == null) {
                return result;
            }
            ObjectMapper mapper = new ObjectMapper()
                    .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            JsonNode root = mapper.readTree(is);
            if (root == null || !root.isArray()) {
                return result;
            }
            for (JsonNode node : root) {
                if (!node.isObject()) continue;
                ObjectNode obj = (ObjectNode) node;
                obj.remove("id");
                obj.remove("dateCreation");
                obj.remove("demandes");
                Client c = mapper.treeToValue(obj, Client.class);
                c.setId(null);
                if (c.getNom() != null && !c.getNom().isBlank()
                        && c.getPrenom() != null && !c.getPrenom().isBlank()
                        && c.getAge() >= 18 && c.getAge() <= 100) {
                    result.add(c);
                }
            }
        } catch (Exception e) {
            log.warn("Lecture de societaires.json impossible : {}", e.getMessage());
            return new ArrayList<>();
        }
        return result;
    }

    private InputStream ouvrirSocietairesJson() throws Exception {
        // societaires_complet.json d'abord (identité + agrégats comportementaux
        // pour le pré-remplissage du wizard) ; repli sur societaires.json.
        for (String nom : new String[]{"societaires_complet.json", "societaires.json"}) {
            ClassPathResource resource = new ClassPathResource("data/" + nom);
            if (resource.exists()) {
                return resource.getInputStream();
            }
            for (String prefixe : new String[]{"data/", "../data/", "backend/data/"}) {
                File f = new File(prefixe + nom);
                if (f.exists()) {
                    return new FileInputStream(f);
                }
            }
        }
        return null;
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
