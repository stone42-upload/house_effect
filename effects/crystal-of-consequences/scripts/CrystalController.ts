/**
 * CrystalController v2 — Fix "Main Morte"
 * ─────────────────────────────────────────
 * Contrôle le paramètre "CorruptionLevel" d'un shader procédural
 * via la position horizontale de la main trackée (Hand Tracker).
 *
 * Système de détection à 3 états :
 *   ACTIVE  → la main bouge, tracking en temps réel
 *   HOLDING → la main est immobile depuis < STILL_TIMEOUT, cristal figé
 *   LOST    → la main a disparu depuis > STILL_TIMEOUT, retour neutre
 *
 * Swipe gauche → Pureté (0.0)
 * Swipe droite → Corruption (1.0)
 * Pas de main  → Retour neutre (0.5) après délai de tolérance
 *
 * ── Traçabilité API ──
 * getSceneObject()            → SceneObject
 * scene.findSceneObject()     → SceneObject (Recherche)
 * getTransform()              → Transform
 * getWorldPosition()          → Transform (Espace Monde)
 * worldToViewportPoint()      → Camera (Conversions)
 * getComponent('MeshRenderer')→ SceneObject (Composants)
 * mainMaterial                → Material (Accès)
 * mat.setFloat()              → Material (Setters uniforms)
 * Vector3f.distanceTo()       → Math (Vector3f)
 * EventManager.*              → EventManager (Communication)
 * Math.pow()                  → JavaScript natif
 */

@component()
export class CrystalController extends APJS.BasicScriptComponent {

  // ═══════════════════════════════════════════
  // CONSTANTES
  // ═══════════════════════════════════════════

  /** Seuil de mouvement pour considérer la main en déplacement */
  private readonly MOVEMENT_THRESHOLD: number = 0.001;

  /** Valeur neutre (cristal en état d'hésitation) */
  private readonly NEUTRAL_VALUE: number = 0.5;

  /** Nom du paramètre shader cible */
  private readonly SHADER_PARAM: string = 'CorruptionLevel';

  /** Seuil bas pour verrouiller le choix Pureté */
  private readonly PURITY_THRESHOLD: number = 0.15;

  /** Seuil haut pour verrouiller le choix Corruption */
  private readonly CORRUPTION_THRESHOLD: number = 0.85;

  /** Durée de maintien pour verrouiller un choix (secondes) */
  private readonly LOCK_DURATION: number = 0.5;

  /** Facteur de lissage principal */
  private readonly SMOOTH_FACTOR: number = 0.1;

  /** Facteur de retour vers le neutre */
  private readonly NEUTRAL_RETURN_FACTOR: number = 0.02;

  /** Framerate de référence pour le lerp indépendant */
  private readonly REFERENCE_FPS: number = 60;

  /** Durée max d'immobilité avant de considérer la main perdue (secondes) */
  private readonly STILL_TIMEOUT: number = 2.0;

  // ═══════════════════════════════════════════
  // VARIABLES INTERNES — PRÉ-ALLOUÉES
  // ═══════════════════════════════════════════

  /** Matériau du cristal */
  private _material: APJS.Material | null = null;

  /** Composant Camera */
  private _camera: APJS.Camera | null = null;

  /** Transform du Hand Tracker */
  private _handTransform: APJS.Transform | null = null;

  /** Position monde de la main — frame précédente */
  private _prevHandPos: APJS.Vector3f = new APJS.Vector3f(0, 0, 0);

  /** Position monde de la main — frame courante */
  private _currHandPos: APJS.Vector3f = new APJS.Vector3f(0, 0, 0);

  /** Valeur X lissée (0.0 → 1.0) */
  private _smoothedX: number = 0.5;

  /** Timer d'accumulation — zone Pureté */
  private _purityTimer: number = 0.0;

  /** Timer d'accumulation — zone Corruption */
  private _corruptionTimer: number = 0.0;

  /** Flag de verrouillage */
  private _isLocked: boolean = false;

  /** Identifiant de l'événement DecisionLocked */
  private _decisionEvent: number = 0;

  /** Identifiant de l'événement CrystalStateChanged */
  private _stateChangedEvent: number = 0;

  /** Première frame */
  private _isFirstFrame: boolean = true;

  /** Timer d'immobilité de la main (Fix "Main Morte") */
  private _stillTimer: number = 0.0;

  /** État précédent de détection — pour émettre les changements d'état */
  private _previousDetectionState: string = 'LOST';

  // ═══════════════════════════════════════════
  // LIFECYCLE — INITIALISATION
  // ═══════════════════════════════════════════

  onStart(): void {
    // Récupération du Hand Tracker
    const handObj = this.getSceneObject().scene.findSceneObject('Hand Tracker');
    if (handObj) {
      this._handTransform = handObj.getTransform();
    }

    // Récupération du cristal et de son matériau
    const crystalObj = this.getSceneObject().scene.findSceneObject('Crystal');
    if (crystalObj) {
      const renderer = crystalObj.getComponent('MeshRenderer') as APJS.MeshRenderer;
      if (renderer) {
        this._material = renderer.mainMaterial;
      }
    }

    // Récupération de la caméra
    const camObj = this.getSceneObject().scene.findSceneObject('Camera');
    if (camObj) {
      this._camera = camObj.getComponent('Camera') as APJS.Camera;
    }

    // Enregistrement des événements custom
    this._decisionEvent = APJS.EventManager.defineUserEventType('DecisionLocked');
    this._stateChangedEvent = APJS.EventManager.defineUserEventType('CrystalStateChanged');

    // État initial du shader
    this._setCorruptionLevel(this.NEUTRAL_VALUE);
  }

  // ═══════════════════════════════════════════
  // LIFECYCLE — BOUCLE PRINCIPALE (30 FPS)
  // ═══════════════════════════════════════════

  onUpdate(deltaTime: number): void {
    // Post-verrouillage → CPU = 0
    if (this._isLocked) {
      return;
    }

    // Pas de tracker ou de caméra → rien à faire
    if (!this._handTransform || !this._camera) {
      return;
    }

    // Lecture de la position monde de la main
    const worldPos = this._handTransform.getWorldPosition();

    // Copie sans allocation (pas de new)
    this._currHandPos.x = worldPos.x;
    this._currHandPos.y = worldPos.y;
    this._currHandPos.z = worldPos.z;

    // Première frame : initialiser la position précédente
    if (this._isFirstFrame) {
      this._prevHandPos.x = this._currHandPos.x;
      this._prevHandPos.y = this._currHandPos.y;
      this._prevHandPos.z = this._currHandPos.z;
      this._isFirstFrame = false;
      return;
    }

    // ── Détection à 3 états (Fix "Main Morte") ──
    const movementDelta = this._currHandPos.distanceTo(this._prevHandPos);

    if (movementDelta > this.MOVEMENT_THRESHOLD) {
      // ══════════════════════════════
      // ÉTAT ACTIVE — la main bouge
      // ══════════════════════════════
      this._stillTimer = 0.0;
      this._emitStateChange('ACTIVE');

      // Conversion monde → viewport (0.0 → 1.0)
      const vpPos = this._camera.worldToViewportPoint(this._currHandPos);
      const rawX = this._clamp(vpPos.x, 0.0, 1.0);

      // Lissage indépendant du framerate
      const adaptedFactor = 1.0 - Math.pow(
        1.0 - this.SMOOTH_FACTOR,
        deltaTime * this.REFERENCE_FPS
      );
      this._smoothedX = this._lerp(this._smoothedX, rawX, adaptedFactor);

      // Évaluation du verrouillage
      this._evaluateLock(deltaTime);

    } else {
      // La main ne bouge pas — mais est-elle encore là ?
      this._stillTimer += deltaTime;

      if (this._stillTimer < this.STILL_TIMEOUT) {
        // ══════════════════════════════════════
        // ÉTAT HOLDING — main immobile mais présente
        // Le cristal RESTE FIGÉ à sa position
        // ══════════════════════════════════════
        this._emitStateChange('HOLDING');

        // On continue d'évaluer le verrouillage
        // (si la main est figée dans la zone de décision, ça compte)
        this._evaluateLock(deltaTime);

      } else {
        // ══════════════════════════════════════
        // ÉTAT LOST — la main a disparu
        // Retour progressif vers 0.5
        // ══════════════════════════════════════
        this._emitStateChange('LOST');

        const neutralFactor = 1.0 - Math.pow(
          1.0 - this.NEUTRAL_RETURN_FACTOR,
          deltaTime * this.REFERENCE_FPS
        );
        this._smoothedX = this._lerp(
          this._smoothedX,
          this.NEUTRAL_VALUE,
          neutralFactor
        );

        // Reset des timers de verrouillage
        this._purityTimer = 0.0;
        this._corruptionTimer = 0.0;
      }
    }

    // Mise à jour de la position précédente (swap sans allocation)
    this._prevHandPos.x = this._currHandPos.x;
    this._prevHandPos.y = this._currHandPos.y;
    this._prevHandPos.z = this._currHandPos.z;

    // Envoi au shader
    this._setCorruptionLevel(this._smoothedX);
  }

  // ═══════════════════════════════════════════
  // LOGIQUE DE VERROUILLAGE
  // ═══════════════════════════════════════════

  private _evaluateLock(deltaTime: number): void {
    if (this._smoothedX < this.PURITY_THRESHOLD) {
      // Zone Pureté (gauche)
      this._purityTimer += deltaTime;
      this._corruptionTimer = 0.0;
      if (this._purityTimer >= this.LOCK_DURATION) {
        this._lockDecision('purity', 0.0);
      }
    } else if (this._smoothedX > this.CORRUPTION_THRESHOLD) {
      // Zone Corruption (droite)
      this._corruptionTimer += deltaTime;
      this._purityTimer = 0.0;
      if (this._corruptionTimer >= this.LOCK_DURATION) {
        this._lockDecision('corruption', 1.0);
      }
    } else {
      // Zone neutre — reset
      this._purityTimer = 0.0;
      this._corruptionTimer = 0.0;
    }
  }

  private _lockDecision(choice: string, finalValue: number): void {
    this._isLocked = true;
    this._smoothedX = finalValue;
    this._setCorruptionLevel(finalValue);

    // Émission de l'événement DecisionLocked
    const emitter = APJS.EventManager.getGlobalEmitter();
    const evt = APJS.EventManager.createEvent(this._decisionEvent);
    evt.args.push(choice);       // 'purity' ou 'corruption'
    evt.args.push(finalValue);   // 0.0 ou 1.0
    emitter.emit(evt);
  }

  // ═══════════════════════════════════════════
  // COMMUNICATION D'ÉTAT
  // ═══════════════════════════════════════════

  /**
   * Émet un événement quand l'état de détection change.
   * Évite les émissions redondantes via _previousDetectionState.
   */
  private _emitStateChange(newState: string): void {
    if (newState === this._previousDetectionState) {
      return; // Pas de changement → pas d'émission
    }
    this._previousDetectionState = newState;

    const emitter = APJS.EventManager.getGlobalEmitter();
    const evt = APJS.EventManager.createEvent(this._stateChangedEvent);
    evt.args.push(newState);            // 'ACTIVE' | 'HOLDING' | 'LOST'
    evt.args.push(this._smoothedX);     // Valeur actuelle du cristal
    emitter.emit(evt);
  }

  // ═══════════════════════════════════════════
  // SHADER BRIDGE
  // ═══════════════════════════════════════════

  private _setCorruptionLevel(value: number): void {
    if (this._material) {
      this._material.setFloat(this.SHADER_PARAM, value);
    }
  }

  // ═══════════════════════════════════════════
  // UTILITAIRES — ZERO ALLOCATION
  // ═══════════════════════════════════════════

  private _lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private _clamp(value: number, min: number, max: number): number {
    return value < min ? min : value > max ? max : value;
  }
}
