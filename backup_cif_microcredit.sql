--
-- PostgreSQL database dump - Samdé CIF Microcrédit
-- Sauvegarde automatique de récupération
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE TABLE IF NOT EXISTS public.clients (
    id bigint NOT NULL,
    age integer NOT NULL,
    anciennete_activite_annees double precision NOT NULL,
    charges_mensuelles_fcfa double precision NOT NULL,
    date_creation timestamp(6) without time zone,
    nom character varying(255),
    prenom character varying(255),
    revenu_mensuel_fcfa double precision NOT NULL,
    score_risque double precision,
    statut_credit character varying(255),
    secteur_activite character varying(255),
    telephone character varying(255)
);

ALTER TABLE public.clients OWNER TO cif_user;

CREATE TABLE IF NOT EXISTS public.demandes_credit (
    id bigint NOT NULL,
    charges_mensuelles_fcfa double precision NOT NULL,
    date_creation timestamp(6) without time zone,
    duree_mois integer NOT NULL,
    montant_demande_fcfa double precision NOT NULL,
    revenu_mensuel_fcfa double precision NOT NULL,
    score_risque double precision,
    statut character varying(255),
    client_id bigint NOT NULL
);

ALTER TABLE public.demandes_credit OWNER TO cif_user;

-- Data
INSERT INTO public.clients VALUES (1, 35, 3, 50000, '2026-08-20 21:20:46.26632', 'Diop', 'Amadou', 150000, 45, 'A_L_ETUDE', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.clients VALUES (2, 35, 3, 50000, '2026-08-20 21:36:13.249763', 'Diop', 'Amadou', 150000, NULL, 'ERREUR_IA', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.clients VALUES (3, 35, 3, 50000, '2026-08-20 21:39:26.83021', 'Diop', 'Amadou', 150000, 5.670000076293945, 'APPROUVE', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO public.clients VALUES (4, 35, 3, 50000, '2026-08-20 22:42:02.278876', 'Diop', 'Amadou', 150000, 5.670000076293945, 'APPROUVE', NULL, NULL) ON CONFLICT DO NOTHING;

INSERT INTO public.demandes_credit VALUES (1, 78000, '2026-08-20 23:24:11.953664', 12, 1000000, 1200, 20.079999923706055, 'APPROUVE', 1) ON CONFLICT DO NOTHING;
