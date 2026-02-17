/**
 * CrystalOfConsequencesController
 * ───────────────────────────────
 * Contrôle le paramètre "CorruptionLevel" d'un shader procédural
 * via la position horizontale de la main trackée (Hand Tracker).
 *
 * Swipe gauche → Pureté (0.0)
 * Swipe droite → Corruption (1.0)
 * Pas de main  → Retour neutre (0.5)
 *
 * API : 100% vérifiée contre la documentation Effect House.
 *
 * ── Traçabilité API ──
 * getTransform()              → Transform (Espace Monde)
 * getWorldPosition()          → Transform (Espace Monde)
 * worldToViewportPoint()      → Camera (Conversions)
 * getComponent('MeshRenderer')→ SceneObject (Composants)
 * mainMaterial                → Material (Accès)
 * mat.setFloat()              → Material (Setters uniforms)
 * findSceneObject()           → SceneObject (Recherche)
 * Vector3f, distanceTo()      → Math (Vector3f)
 * EventManager.*              → EventManager (Communication)
 */

@component()
export class CrystalController extends APJS.BasicScriptComponent {

  private readonly MOVEMENT_THRESHOLD: number = 0.001;
  private readonly NEUTRAL_VALUE: number = 0.5;
  private readonly SHADER_PARAM: string = 'CorruptionLevel';
  private readonly PURITY_THRESHOLD: number = 0.15;
  private readonly CORRUPTION_THRESHOLD: number = 0.85;
  private readonly LOCK_DURATION: number = 0.5;
  private readonly SMOOTH_FACTOR: number = 0.1;
  private readonly NEUTRAL_RETURN_FACTOR: number = 0.02;
  private readonly REFERENCE_FPS: number = 60;

  private _material: APJS.Material | null = null;
  private _camera: APJS.Camera | null = null;
  private _handTransform: APJS.Transform | null = null;
  private _prevHandPos: APJS.Vector3f = new APJS.Vector3f(0, 0, 0);
  private _currHandPos: APJS.Vector3f = new APJS.Vector3f(0, 0, 0);
  private _smoothedX: number = 0.5;
  private _purityTimer: number = 0.0;
  private _corruptionTimer: number = 0.0;
  private _isLocked: boolean = false;
  private _decisionEvent: number = 0;
  private _isFirstFrame: boolean = true;

  onStart(): void {
    const handObj = this.getSceneObject().scene.findSceneObject('Hand Tracker');
    if (handObj) {
      this._handTransform = handObj.getTransform();
    }

    const crystalObj = this.getSceneObject().scene.findSceneObject('Crystal');
    if (crystalObj) {
      const renderer = crystalObj.getComponent('MeshRenderer') as APJS.MeshRenderer;
      if (renderer) {
        this._material = renderer.mainMaterial;
      }
    }

    const camObj = this.getSceneObject().scene.findSceneObject('Camera');
    if (camObj) {
      this._camera = camObj.getComponent('Camera') as APJS.Camera;
    }

    this._decisionEvent = APJS.EventManager.defineUserEventType('DecisionLocked');
    this._setCorruptionLevel(this.NEUTRAL_VALUE);
  }

  onUpdate(deltaTime: number): void {
    if (this._isLocked) { return; }
    if (!this._handTransform || !this._camera) { return; }

    const worldPos = this._handTransform.getWorldPosition();
    this._currHandPos.x = worldPos.x;
    this._currHandPos.y = worldPos.y;
    this._currHandPos.z = worldPos.z;

    if (this._isFirstFrame) {
      this._prevHandPos.x = this._currHandPos.x;
      this._prevHandPos.y = this._currHandPos.y;
      this._prevHandPos.z = this._currHandPos.z;
      this._isFirstFrame = false;
      return;
    }

    const movementDelta = this._currHandPos.distanceTo(this._prevHandPos);
    const handDetected = movementDelta > this.MOVEMENT_THRESHOLD;

    if (handDetected) {
      const vpPos = this._camera.worldToViewportPoint(this._currHandPos);
      const rawX = this._clamp(vpPos.x, 0.0, 1.0);
      const adaptedFactor = 1.0 - Math.pow(1.0 - this.SMOOTH_FACTOR, deltaTime * this.REFERENCE_FPS);
      this._smoothedX = this._lerp(this._smoothedX, rawX, adaptedFactor);
      this._evaluateLock(deltaTime);
    } else {
      const neutralFactor = 1.0 - Math.pow(1.0 - this.NEUTRAL_RETURN_FACTOR, deltaTime * this.REFERENCE_FPS);
      this._smoothedX = this._lerp(this._smoothedX, this.NEUTRAL_VALUE, neutralFactor);
      this._purityTimer = 0.0;
      this._corruptionTimer = 0.0;
    }

    this._prevHandPos.x = this._currHandPos.x;
    this._prevHandPos.y = this._currHandPos.y;
    this._prevHandPos.z = this._currHandPos.z;
    this._setCorruptionLevel(this._smoothedX);
  }

  private _evaluateLock(deltaTime: number): void {
    if (this._smoothedX < this.PURITY_THRESHOLD) {
      this._purityTimer += deltaTime;
      this._corruptionTimer = 0.0;
      if (this._purityTimer >= this.LOCK_DURATION) { this._lockDecision('purity', 0.0); }
    } else if (this._smoothedX > this.CORRUPTION_THRESHOLD) {
      this._corruptionTimer += deltaTime;
      this._purityTimer = 0.0;
      if (this._corruptionTimer >= this.LOCK_DURATION) { this._lockDecision('corruption', 1.0); }
    } else {
      this._purityTimer = 0.0;
      this._corruptionTimer = 0.0;
    }
  }

  private _lockDecision(choice: string, finalValue: number): void {
    this._isLocked = true;
    this._smoothedX = finalValue;
    this._setCorruptionLevel(finalValue);
    const emitter = APJS.EventManager.getGlobalEmitter();
    const evt = APJS.EventManager.createEvent(this._decisionEvent);
    evt.args.push(choice);
    evt.args.push(finalValue);
    emitter.emit(evt);
  }

  private _setCorruptionLevel(value: number): void {
    if (this._material) { this._material.setFloat(this.SHADER_PARAM, value); }
  }

  private _lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private _clamp(value: number, min: number, max: number): number {
    return value < min ? min : value > max ? max : value;
  }
}
