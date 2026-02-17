/**
 * CrystalBreathingController
 * ──────────────────────────
 * Animation de "respiration" subtile du cristal quand il est en état neutre.
 * Oscillation de ±2% du scale à 2.0 Hz (respiration calme, méditative).
 *
 * Actif uniquement quand l'état de détection est LOST (pas de main).
 * Se désactive sur ACTIVE, HOLDING, ou après un DecisionLocked.
 *
 * ── Traçabilité API ──
 * getSceneObject()            → SceneObject
 * scene.findSceneObject()     → SceneObject (Recherche)
 * getTransform()              → Transform
 * t.localScale                → Transform (Espace Local)
 * EventManager.*              → EventManager (Communication)
 * Math.sin()                  → JavaScript natif
 */

@component()
export class CrystalBreathingController extends APJS.BasicScriptComponent {

  // ═══════════════════════════════════════════
  // CONSTANTES
  // ═══════════════════════════════════════════

  /** Amplitude de la respiration (±2%) */
  private readonly BREATH_AMPLITUDE: number = 0.02;

  /** Fréquence de la respiration (Hz) */
  private readonly BREATH_FREQUENCY: number = 2.0;

  // ═══════════════════════════════════════════
  // VARIABLES INTERNES — PRÉ-ALLOUÉES
  // ═══════════════════════════════════════════

  /** Transform du cristal */
  private _crystalTransform: APJS.Transform | null = null;

  /** Scale de base du cristal — pré-alloué */
  private _baseScale: APJS.Vector3f = new APJS.Vector3f(1, 1, 1);

  /** Timer de respiration (accumulateur de temps) */
  private _breathTimer: number = 0.0;

  /** Flag de respiration active */
  private _isBreathing: boolean = true;

  /** Flag de décision verrouillée (arrêt définitif) */
  private _isLocked: boolean = false;

  /** Identifiant de l'événement CrystalStateChanged */
  private _stateChangedEvent: number = 0;

  /** Identifiant de l'événement DecisionLocked */
  private _decisionEvent: number = 0;

  // ═══════════════════════════════════════════
  // LIFECYCLE — INITIALISATION
  // ═══════════════════════════════════════════

  onStart(): void {
    // Récupération du cristal
    const crystalObj = this.getSceneObject().scene.findSceneObject('Crystal');
    if (crystalObj) {
      this._crystalTransform = crystalObj.getTransform();

      // Sauvegarde du scale de base
      const s = this._crystalTransform.localScale;
      this._baseScale.x = s.x;
      this._baseScale.y = s.y;
      this._baseScale.z = s.z;
    }

    // Enregistrement et écoute des événements
    this._stateChangedEvent = APJS.EventManager.defineUserEventType('CrystalStateChanged');
    this._decisionEvent = APJS.EventManager.defineUserEventType('DecisionLocked');

    const emitter = APJS.EventManager.getGlobalEmitter();
    emitter.on(this._stateChangedEvent, this._onStateChanged, this);
    emitter.on(this._decisionEvent, this._onDecisionLocked, this);
  }

  // ═══════════════════════════════════════════
  // LIFECYCLE — BOUCLE PRINCIPALE
  // ═══════════════════════════════════════════

  onUpdate(deltaTime: number): void {
    // Arrêt définitif après verrouillage
    if (this._isLocked) {
      return;
    }

    if (!this._crystalTransform) {
      return;
    }

    if (this._isBreathing) {
      // Accumulation du temps
      this._breathTimer += deltaTime;

      // Oscillation sinusoïdale : ±2% du scale de base à 2.0 Hz
      const breathFactor = 1.0 + Math.sin(this._breathTimer * this.BREATH_FREQUENCY * Math.PI * 2.0) * this.BREATH_AMPLITUDE;

      // Application du scale (pas de new)
      this._crystalTransform.localScale.x = this._baseScale.x * breathFactor;
      this._crystalTransform.localScale.y = this._baseScale.y * breathFactor;
      this._crystalTransform.localScale.z = this._baseScale.z * breathFactor;
    }
  }

  // ═══════════════════════════════════════════
  // ÉVÉNEMENTS
  // ═══════════════════════════════════════════

  /**
   * Callback quand l'état de détection change.
   * Active la respiration en état LOST, la désactive sinon.
   */
  private _onStateChanged(event: APJS.IEvent): void {
    const state = event.args[0] as string;

    if (state === 'LOST') {
      // Pas de main → activer la respiration
      this._isBreathing = true;
    } else {
      // Main détectée (ACTIVE ou HOLDING) → désactiver et restaurer le scale
      this._isBreathing = false;
      this._breathTimer = 0.0;
      this._restoreBaseScale();
    }
  }

  /**
   * Callback quand une décision est verrouillée.
   * Arrête définitivement la respiration.
   */
  private _onDecisionLocked(event: APJS.IEvent): void {
    this._isLocked = true;
    this._isBreathing = false;
    this._restoreBaseScale();
  }

  /**
   * Restaure le scale de base du cristal.
   */
  private _restoreBaseScale(): void {
    if (this._crystalTransform) {
      this._crystalTransform.localScale.x = this._baseScale.x;
      this._crystalTransform.localScale.y = this._baseScale.y;
      this._crystalTransform.localScale.z = this._baseScale.z;
    }
  }
}
