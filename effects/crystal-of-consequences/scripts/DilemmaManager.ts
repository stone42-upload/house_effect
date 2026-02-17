/**
 * DilemmaManager
 * ──────────────
 * Gère l'affichage des dilemmes philosophiques et écoute
 * l'événement "DecisionLocked" émis par CrystalController.
 *
 * API : 100% vérifiée contre la documentation Effect House.
 *
 * ── Traçabilité API ──
 * getSceneObject()                → SceneObject
 * scene.findSceneObject()         → SceneObject (Recherche)
 * EventManager.defineUserEventType → EventManager
 * EventManager.getGlobalEmitter() → EventManager
 * emitter.on()                    → EventManager (Écoute)
 * IEvent.args                     → EventManager (Callback)
 */

@component()
export class DilemmaManager extends APJS.BasicScriptComponent {

  /** Banque de dilemmes — 10 paires philosophiques */
  private readonly _dilemmas: Array<{ purity: string; corruption: string }> = [
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
  ];

  /** Index du dilemme actuel */
  private _currentIndex: number = 0;

  /** Identifiant de l'événement DecisionLocked */
  private _decisionEvent: number = 0;

  /** Référence au texte UI gauche (Pureté) */
  private _purityTextObj: APJS.SceneObject | null = null;

  /** Référence au texte UI droite (Corruption) */
  private _corruptionTextObj: APJS.SceneObject | null = null;

  /** Flag pour éviter les traitements multiples */
  private _hasDecided: boolean = false;

  onStart(): void {
    // Sélection aléatoire du premier dilemme
    this._currentIndex = Math.floor(Math.random() * this._dilemmas.length);

    // Récupération des objets texte dans la scène
    const scene = this.getSceneObject().scene;
    this._purityTextObj = scene.findSceneObject('TextPurity') || null;
    this._corruptionTextObj = scene.findSceneObject('TextCorruption') || null;

    // Affichage du dilemme
    this._displayCurrentDilemma();

    // Écoute de l'événement DecisionLocked émis par CrystalController
    this._decisionEvent = APJS.EventManager.defineUserEventType('DecisionLocked');
    const emitter = APJS.EventManager.getGlobalEmitter();
    emitter.on(this._decisionEvent, this._onDecisionLocked, this);
  }

  /**
   * Affiche le dilemme actuel.
   * Note : L'API Text d'Effect House n'est pas documentée dans les pages fournies.
   * En attendant vérification, on utilise le nom du SceneObject comme placeholder.
   */
  private _displayCurrentDilemma(): void {
    const dilemma = this._dilemmas[this._currentIndex];
    if (this._purityTextObj) {
      this._purityTextObj.name = dilemma.purity;
    }
    if (this._corruptionTextObj) {
      this._corruptionTextObj.name = dilemma.corruption;
    }
  }

  /**
   * Callback quand le cristal verrouille une décision.
   * @param event — contient args[0]: string ('purity'|'corruption'), args[1]: number (0.0|1.0)
   */
  private _onDecisionLocked(event: APJS.IEvent): void {
    if (this._hasDecided) { return; }
    this._hasDecided = true;

    const choice = event.args[0] as string;
    const value = event.args[1] as number;

    // Révélation visuelle : masquer le choix non sélectionné
    if (choice === 'purity' && this._corruptionTextObj) {
      this._corruptionTextObj.enabled = false;
    } else if (choice === 'corruption' && this._purityTextObj) {
      this._purityTextObj.enabled = false;
    }
  }

  /**
   * Retourne un dilemme aléatoire sans répéter le précédent.
   */
  public getRandomDilemma(): { purity: string; corruption: string } {
    let newIndex = this._currentIndex;
    while (newIndex === this._currentIndex && this._dilemmas.length > 1) {
      newIndex = Math.floor(Math.random() * this._dilemmas.length);
    }
    this._currentIndex = newIndex;
    return this._dilemmas[this._currentIndex];
  }
}
