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
        if (objetCreditRepository.count() == 0) {
            log.info("Initialisation des Objets de Crédit dans PostgreSQL...");
            objetCreditRepository.saveAll(List.of(
                new ObjetCredit("COMMERCE_FOND_ROULEMENT", "Commerce & Fonds de Roulement", "Commerce & Vente", "Achat de marchandises et fonds de roulement pour boutiques/étals.", 9.5, 12, true),
                new ObjetCredit("AGRI_INTRANTS_CAMPAGNE", "Campagne Agricole & Intrants", "Agriculture", "Achat d'engrais, semences certifiées, matériel de labour et main d'œuvre.", 8.0, 9, true),
                new ObjetCredit("ELEVAGE_EMBOUCHE", "Élevage & Embouche Ovine/Bovine", "Élevage", "Acquisition de têtes de bétail, aliments concentrés et soins vétérinaires.", 9.0, 12, true),
                new ObjetCredit("ARTISANAT_EQUIPEMENT", "Artisanat & Équipement Professionnel", "Artisanat / Métiers", "Achat de machines à coudre, outils de menuiserie ou soudure mécanique.", 10.0, 24, true),
                new ObjetCredit("HABITAT_AMELIORATION", "Amélioration de l'Habitat & Énergie", "Habitat & Cadre de Vie", "Travaux de rénovation, toiture en tôle, électrification solaire ou eau.", 11.0, 36, true),
                new ObjetCredit("SANTE_SCOLARITE_URGENCE", "Crédit Scolarité & Santé / Social", "Social & Famille", "Frais de scolarité universitaire/lycée ou prise en charge médicale urgente.", 8.5, 10, true)
            ));
        }
    }

    private void seedGaranties() {
        if (typeGarantieRepository.count() == 0) {
            log.info("Initialisation des Types de Garanties dans PostgreSQL...");
            typeGarantieRepository.saveAll(List.of(
                new TypeGarantie("CAUTION_SOLIDAIRE_GROUPE", "Caution Solidaire de Groupe", "PERSONNELLE", 100, "Engagement solidaire des membres du groupement solidaire / tontine d'épargne.", false, true),
                new TypeGarantie("CAUTION_INDIVIDUELLE_AVAL", "Caution Individuelle / Avaliste", "PERSONNELLE", 100, "Engagement signé d'un tiers solvable (sociétaire CIF, fonctionnaire ou commerçant).", true, true),
                new TypeGarantie("GAGE_STOCK_MARCHANDISES", "Gage sur Stock de Marchandises", "REELLE_MOBILIERE", 120, "Inventaire contradictoire et nantissement du stock du magasin avec visite agence.", true, true),
                new TypeGarantie("NANTISSEMENT_MATERIEL_VEHICULE", "Nantissement Matériel / Moto / Équipement", "REELLE_MOBILIERE", 120, "Dépôt de la carte grise ou facture originale d'achat de l'équipement/moto.", true, true),
                new TypeGarantie("NANTISSEMENT_DAT_EPARGNE", "Nantissement DAT / Épargne Bloquée", "FINANCIERE", 100, "Blocage du compte d'épargne nantie à hauteur de la quotité requise.", false, true),
                new TypeGarantie("HYPOTHEQUE_TITRE_FONCIER_PUH", "Hypothèque Foncière / PUH / Attestation", "REELLE_IMMOBILIERE", 150, "Attestation d'attribution de parcelle, permis urbain d'habiter ou titre foncier notarié.", true, true)
            ));
        }
    }

    private void seedClientsIfEmpty() {
        if (clientRepository.count() == 0) {
            log.info("Initialisation des sociétaires de démonstration dans la base PostgreSQL...");
            
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

            Client c3 = new Client();
            c3.setNumeroCnib("B12098471");
            c3.setDateExpirationCnib("2032-06-15");
            c3.setNumeroCompte("CPT-0003");
            c3.setTypeCompte("Compte Épargne Sociétaire");
            c3.setStatutCompte("Actif");
            c3.setPartsSocialesFcfa(40000.0);
            c3.setAgence("Agence CIF Koudougou");
            c3.setAncienneteCooperativeMois(36);
            c3.setSoldeEpargneActuelFcfa(310000.0);
            c3.setNom("Sawadogo");
            c3.setPrenom("Awa");
            c3.setAge(29);
            c3.setDateNaissance("1997-01-18");
            c3.setTelephone("+226 78 99 88 77");
            c3.setEmail("awa.sawadogo@cif.bf");
            c3.setPays("Burkina Faso");
            c3.setRegion("Centre-Ouest");
            c3.setVille("Koudougou");
            c3.setAdresse("Secteur 2, Koudougou");
            c3.setTypeLogement("Propriétaire");
            c3.setSecteurActivite("Artisanat");
            c3.setActivite("Couture & confection de pagnes");
            c3.setAncienneteActiviteAnnees(5.0);
            c3.setSexe("Femme");
            c3.setZone("Urbaine");
            c3.setSituationMatrimoniale("Marié(e)");
            c3.setNiveauEducation("Secondaire");
            c3.setNombrePersonnesACharge(2);

            clientRepository.saveAll(List.of(c1, c2, c3));
        }
    }
}
