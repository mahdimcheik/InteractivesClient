import { Injectable, signal } from '@angular/core';

// loader.service.ts
/**
 * Service pour gérer l'état de chargement global de l'application.
 * Utilise un compteur interne pour suivre le nombre de requêtes en cours.
 * Expose un signal isLoading pour que les composants Angular puissent réagir aux changements d'état.
 * Les méthodes show et hide sont utilisées pour incrémenter et décrémenter le compteur.
 * Lorsque le compteur est supérieur à zéro, isLoading est true, sinon false.
 */
@Injectable({ providedIn: 'root' })
export class LoaderService {
    private loadingRequests = 0;
    isLoading = signal<boolean>(false);

    /**
     * Indique le début d'une opération de chargement.
     * Incrémente le compteur interne et met à jour le signal isLoading.
     * Si le compteur est supérieur à zéro, isLoading est true.
     */
    show(): void {
        this.loadingRequests++;
        this.isLoading.set(true);
    }
    /**
     * Indique la fin d'une opération de chargement.
     * Décrémente le compteur interne et met à jour le signal isLoading.
     * Si le compteur atteint zéro, isLoading est false.
     * Le compteur ne peut pas descendre en dessous de zéro.
     */
    hide(): void {
        this.loadingRequests = Math.max(0, this.loadingRequests - 1);
        if (this.loadingRequests === 0) {
            this.isLoading.set(false);
        }
    }
}
