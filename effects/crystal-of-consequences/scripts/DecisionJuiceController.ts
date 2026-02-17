/**
 * DecisionJuiceController
 * ───────────────────────
 * Gère le "juice" visuel au moment du verrouillage de décision.
 *
 * Pureté  → pulse de scale (1.0 → 1.15 → 1.0 en 0.3s) + halo blanc
 * Corruption → tremblement de position (noise pendant 0.2s) + veines max
 *
 * États internes : IDLE | PURITY_JUICE | CORRUPTION_JUICE | DONE
 *
 * ── Traçabilité API ──
 * getSceneObject()            → SceneObject
 * scene.findSceneObject()     → SceneObject (Recherche)
 * getTransform()              → Transform
 * t.localScale                → Transform (Espace Local)
 * t.localPosition             → Transform (Espace Local)
 * EventManager.*              → EventManager (Communication)
 * Math.sin(), Math.PI         → JavaScript natif
 */

@component()
export class DecisionJuiceController extends APJS.BasicScriptComponent {

  // ═══════════════════════════════════════════
  // CONSTANTES
  // ═══════════════════════════════════════════

  /** Durée du pulse de pureté (secondes) */
  private readonly PURITY_DURATION: number = 0.3;

  /** Durée du tremblement de corruption (secondes) */
  private readonly CORRUPTION_DURATION: number = 0.2;

  /** Amplitude du pulse de pureté (±15%) */
  private readonly PULSE_AMPLITUDE: number = 0.15;

  /** Amplitude du tremblement de corruption */
  private readonly SHAKE_AMPLITUDE: number = 0.03;

  /** Fréquence du pseudo-random pour le shake */
  private readonly SHAKE_FREQ_X: number = 127.1;

  /** Fréquence du pseudo-random pour le shake (axe Y) */
  private readonly SHAKE_FREQ_Y: number = 311.7;

  // ═══════════════════════════════════════════
  // VARIABLES INTERNES — PRÉ-ALLOUÉES
  // ═══════════════════════════════════════════

  /** Transform du cristal */
  private _crystalTransform: APJS.Transform | null = null;

  /** Scale original du cristal — pré-alloué */
  private _originalScale: APJS.Vector3f = new APJS.Vector3f(1, 1, 1);

  /** Position originale du cristal — pré-allouée */
  private _originalPosition: APJS.Vector3f = new APJS.Vector3f(0, 0, 0);

  /** État courant de l'animation */
  private _state: string = 'IDLE';

  /** Timer écoulé depuis le début de l'animation */
  private _elapsed: number = 0.0;

  /** Choix verrouillé ('purity' ou 'corruption') */
  private _lockedChoice: string = '';

  /** Identifiant de l'événement DecisionLocked */
  private _decisionEvent: number = 0;

  /** Identifiant de l'événement JuiceComplete */
  private _juiceCompleteEvent: number = 0;

  // ═══════════════════════════════════════════
  // LIFECYCLE — INITIALISATION
  // ═══════════════════════════════════════════

  onStart(): void {
    // Récupération du cristal
    const crystalObj = this.getSceneObject().scene.findSceneObject('Crystal');
    if (crystalObj) {
      this._crystalTransform = crystalObj.getTransform();

      // Sauvegarde du scale original
      const s = this._crystalTransform.localScale;
      this._originalScale.x = s.x;
      this._originalScale.y = s.y;
      this._originalScale.z = s.z;

      // Sauvegarde de la position originale
      const p = this._crystalTransform.localPosition;
      this._originalPosition.x = p.x;
      this._originalPosition.y = p.y;
      this._originalPosition.z = p.z;
    }

    // Enregistrement des événements
    this._decisionEvent = APJS.EventManager.defineUserEventType('DecisionLocked');
    this._juiceCompleteEvent = APJS.EventManager.defineUserEventType('JuiceComplete');

    // Écoute de DecisionLocked
    const emitter = APJS.EventManager.getGlobalEmitter();
    emitter.on(this._decisionEvent, this._onDecisionLocked, this);
  }

  // ═══════════════════════════════════════════
  // LIFECYCLE — BOUCLE PRINCIPALE
  // ═══════════════════════════════════════════

  onUpdate(deltaTime: number): void {
    // Rien à faire si IDLE ou DONE
    if (this._state === 'IDLE' || this._state === 'DONE') {
      return;
    }

    if (!this._crystalTransform) {
      return;
    }

    this._elapsed += deltaTime;

    if (this._state === 'PURITY_JUICE') {
      this._updatePurityPulse();
    } else if (this._state === 'CORRUPTION_JUICE') {
      this._updateCorruptionShake();
    }
  }

  // ═══════════════════════════════════════════
  // ANIMATIONS
  // ═══════════════════════════════════════════

  /**
   * Pulse de pureté : scale oscille via sin sur la durée.
   * Formule : originalScale * (1.0 + sin(elapsed * PI / duration) * 0.15)
   */
  private _updatePurityPulse(): void {
    if (this._elapsed >= this.PURITY_DURATION) {
      // Fin de l'animation — restaurer le scale original
      this._crystalTransform!.localScale = this._originalScale;
      this._finishJuice();
      return;
    }

    // Facteur de pulse sinusoïdal (0 → 1 → 0 sur la durée)
    const pulseFactor = Math.sin(this._elapsed * Math.PI / this.PURITY_DURATION) * this.PULSE_AMPLITUDE;
    const scaleMul = 1.0 + pulseFactor;

    // Application du scale (réutilise _originalScale sans new)
    this._crystalTransform!.localScale.x = this._originalScale.x * scaleMul;
    this._crystalTransform!.localScale.y = this._originalScale.y * scaleMul;
    this._crystalTransform!.localScale.z = this._originalScale.z * scaleMul;
  }

  /**
   * Tremblement de corruption : position noise pseudo-random déterministe.
   * Utilise Math.sin(elapsed * freq) au lieu de Math.random() pour la reproductibilité.
   */
  private _updateCorruptionShake(): void {
    if (this._elapsed >= this.CORRUPTION_DURATION) {
      // Fin de l'animation — restaurer la position originale
      this._crystalTransform!.localPosition.x = this._originalPosition.x;
      this._crystalTransform!.localPosition.y = this._originalPosition.y;
      this._crystalTransform!.localPosition.z = this._originalPosition.z;
      this._finishJuice();
      return;
    }

    // Pseudo-random déterministe via sin à haute fréquence
    const noiseX = Math.sin(this._elapsed * this.SHAKE_FREQ_X) * this.SHAKE_AMPLITUDE;
    const noiseY = Math.sin(this._elapsed * this.SHAKE_FREQ_Y) * this.SHAKE_AMPLITUDE;

    // Application du tremblement (pas de new)
    this._crystalTransform!.localPosition.x = this._originalPosition.x + noiseX;
    this._crystalTransform!.localPosition.y = this._originalPosition.y + noiseY;
    this._crystalTransform!.localPosition.z = this._originalPosition.z;
  }

  // ═══════════════════════════════════════════
  // ÉVÉNEMENTS
  // ═══════════════════════════════════════════

  /**
   * Callback quand le cristal verrouille une décision.
   * Déclenche l'animation de juice correspondante.
   */
  private _onDecisionLocked(event: APJS.IEvent): void {
    const choice = event.args[0] as string;
    this._lockedChoice = choice;
    this._elapsed = 0.0;

    if (choice === 'purity') {
      this._state = 'PURITY_JUICE';
    } else {
      this._state = 'CORRUPTION_JUICE';
    }
  }

  /**
   * Finalise l'animation et émet l'événement JuiceComplete.
   */
  private _finishJuice(): void {
    this._state = 'DONE';

    // Émission de l'événement JuiceComplete
    const emitter = APJS.EventManager.getGlobalEmitter();
    const evt = APJS.EventManager.createEvent(this._juiceCompleteEvent);
    evt.args.push(this._lockedChoice); // 'purity' ou 'corruption'
    emitter.emit(evt);
  }
}
