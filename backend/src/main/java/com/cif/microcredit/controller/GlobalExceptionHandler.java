package com.cif.microcredit.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.HashMap;
import java.util.Map;

/**
 * Centralise la gestion des erreurs pour toute l'API :
 *  - erreurs de validation Bean Validation (@Valid sur Client/DemandeCredit)
 *    -> 400 avec le détail des champs en erreur, exploitable directement par
 *    le frontend pour afficher un message par champ ;
 *  - toute autre exception non prévue -> 500 générique côté client, détail
 *    complet dans les logs serveur uniquement.
 *
 * Corrige le même problème que celui déjà traité côté moteur IA
 * (ai-service/main.py) : ne jamais renvoyer le détail brut d'une exception
 * interne (message, stack trace, requête SQL...) au client.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, String> erreursParChamp = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(erreur ->
                erreursParChamp.put(erreur.getField(), erreur.getDefaultMessage()));

        Map<String, Object> body = new HashMap<>();
        body.put("erreur", "Données invalides");
        body.put("champs", erreursParChamp);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        // Ex. un id ou un ?page= non numérique dans l'URL - même logique que la
        // validation : message clair, pas de détail d'implémentation.
        Map<String, Object> body = new HashMap<>();
        body.put("erreur", "Paramètre invalide : " + ex.getName());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        logger.error("Erreur interne non gérée", ex);
        Map<String, Object> body = new HashMap<>();
        body.put("erreur", "Erreur interne du serveur.");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
