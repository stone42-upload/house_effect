/**
 * DilemmaManager v2
 * ─────────────────
 * Gère l'affichage de 20 dilemmes philosophiques et écoute
 * les événements émis par CrystalController.
 *
 * ── Traçabilité API ──
 * getSceneObject()                → SceneObject
 * scene.findSceneObject()         → SceneObject (Recherche)
 * obj.enabled                     → SceneObject (Activation)
 * EventManager.defineUserEventType→ EventManager
 * EventManager.getGlobalEmitter() → EventManager
 * emitter.on()                    → EventManager (Écoute)
 * IEvent.args                     → EventManager (Callback)
 */

@component()
export class DilemmaManager extends APJS.BasicScriptComponent {

  /** Banque de 20 dilemmes philosophiques */
  private readonly _dilemmas: Array<{ purity: string; corruption: string }> = [
    // ── Dilemmes originaux ──
    { purity: 'Pardonner sincèrement', corruption: 'Se protéger en coupant les ponts' },
    { purity: 'Dire une vérité qui blesse', corruption: 'Mentir pour protéger' },
    { purity: 'Suivre sa passion sans garantie', corruption: 'Choisir la sécurité financière' },
    { purity: 'Rester fidèle à soi-même', corruption: "S'adapter pour plaire" },
    { purity: 'Agir maintenant imparfaitement', corruption: 'Attendre la perfection' },
    { purity: 'Faire confiance aveuglément', corruption: 'Douter de tout' },
    { purity: "Vivre l'instant présent", corruption: 'Planifier chaque détail' },
    { purity: "Accepter l'échec comme leçon", corruption: 'Ne jamais accepter la défaite' },
    { purity: 'Donner sans compter', corruption: "Se préserver d'abord" },
    { purity: 'Affronter la peur', corruption: "Écouter son instinct de survie" },
    // ── Nouveaux dilemmes ──
    { purity: 'Ouvrir son cœur à nouveau', corruption: 'Ne plus jamais être vulnérable' },
    { purity: 'Défendre un inconnu', corruption: 'Ne pas se mêler des affaires des autres' },
    { purity: 'Avouer ses erreurs', corruption: 'Protéger sa réputation' },
    { purity: 'Partager son secret', corruption: 'Garder le mystère' },
    { purity: 'Recommencer à zéro', corruption: 'Construire sur les ruines' },
    { purity: 'Rêver sans limites', corruption: 'Rester ancré dans le réel' },
    { purity: 'Choisir la liberté totale', corruption: 'Choisir la stabilité absolue' },
    { purity: 'Écouter son cœur', corruption: 'Écouter sa raison' },
    { purity: 'Lâcher prise', corruption: 'Se battre jusqu\'au bout' },
    { purity: 'Croire en l\'impossible', corruption: 'Accepter les limites du réel' },
  ];

  /** Index du dilemme actuel */
  private _currentIndex: number = 0;

  /** Historique des 5 derniers indices (anti-répétition) */
  private _recentIndices: number[] = [];

  /** Taille maximale de l'historique */
  private readonly _historySize: number = 5;

  /** Identifiant de l'événement DecisionLocked */
  private _decisionEvent: number = 0;

  /** Identifiant de l'événement CrystalStateChanged */
  private _stateChangedEvent: number = 0;

  /** Référence au texte UI gauche (Pureté) */
  private _purityTextObj: APJS.SceneObject | null = null;

  /** Référence au texte UI droite (Corruption) */
  private _corruptionTextObj: APJS.SceneObject | null = null;

  /** Flag de décision prise */
  private _hasDecided: boolean = false;

  onStart(): void {
    // Sélection aléatoire du premier dilemme
    this._currentIndex = Math.floor(Math.random() * this._dilemmas.length);
    this._recentIndices.push(this._currentIndex);

    // Récupération des objets texte dans la scène
    const scene = this.getSceneObject().scene;
    this._purityTextObj = scene.findSceneObject('TextPurity') || null;
    this._corruptionTextObj = scene.findSceneObject('TextCorruption') || null;

    // Affichage du dilemme
    this._displayCurrentDilemma();

    // Écoute des événements
    this._decisionEvent = APJS.EventManager.defineUserEventType('DecisionLocked');
    this._stateChangedEvent = APJS.EventManager.defineUserEventType('CrystalStateChanged');

    const emitter = APJS.EventManager.getGlobalEmitter();
    emitter.on(this._decisionEvent, this._onDecisionLocked, this);
    emitter.on(this._stateChangedEvent, this._onStateChanged, this);
  }

  /**
   * Affiche le dilemme actuel.
   * Utilise le nom du SceneObject comme mécanisme d'affichage.
   * En production, connecter aux composants Text via Visual Scripting.
   */
  private _displayCurrentDilemma(): void {
    const dilemma = this._dilemmas[this._currentIndex];
    if (this._purityTextObj) {
      this._purityTextObj.name = dilemma.purity;
      this._purityTextObj.enabled = true;
    }
    if (this._corruptionTextObj) {
      this._corruptionTextObj.name = dilemma.corruption;
      this._corruptionTextObj.enabled = true;
    }
  }

  /**
   * Callback quand le cristal verrouille une décision.
   * Masque le choix non retenu.
   */
  private _onDecisionLocked(event: APJS.IEvent): void {
    if (this._hasDecided) { return; }
    this._hasDecided = true;

    const choice = event.args[0] as string;

    // Masquer le choix non sélectionné
    if (choice === 'purity' && this._corruptionTextObj) {
      this._corruptionTextObj.enabled = false;
    } else if (choice === 'corruption' && this._purityTextObj) {
      this._purityTextObj.enabled = false;
    }
  }

  /**
   * Callback quand l'état de détection change.
   * Utilisé pour du feedback visuel subtil sur les textes.
   */
  private _onStateChanged(event: APJS.IEvent): void {
    const state = event.args[0] as string;

    // Quand la main est perdue, on pourrait rendre les textes plus visibles
    // Quand la main est active, les textes restent normaux
    // Implémentation visuelle à connecter via Visual Scripting ou Image.opacity
  }

  /**
   * Retourne un dilemme aléatoire en évitant les 5 derniers.
   */
  public getRandomDilemma(): { purity: string; corruption: string } {
    let newIndex = this._currentIndex;
    let attempts = 0;
    const maxAttempts = 50; // Sécurité anti-boucle infinie

    while (this._recentIndices.indexOf(newIndex) !== -1 && attempts < maxAttempts) {
      newIndex = Math.floor(Math.random() * this._dilemmas.length);
      attempts++;
    }

    this._currentIndex = newIndex;

    // Mise à jour de l'historique
    this._recentIndices.push(newIndex);
    if (this._recentIndices.length > this._historySize) {
      this._recentIndices.shift(); // Supprimer le plus ancien
    }

    return this._dilemmas[this._currentIndex];
  }
}
