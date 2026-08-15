import { ARR_MS, DAS_MS, KEYBINDS } from "./config";

type ActionName = keyof typeof KEYBINDS;

export interface InputHandlers {
  onRotateCW?: () => void;
  onRotateCCW?: () => void;
  onHardDrop?: () => void;
  onHold?: () => void;
  onPause?: () => void;
  onRestart?: () => void;
  onMute?: () => void;
  onAnyKey?: (e: KeyboardEvent) => void;
  onMoveLeft?: () => void; // called once per discrete left-step (initial press + each ARR repeat)
  onMoveRight?: () => void;
}

export class InputController {
  private pressed = new Set<string>();
  private codeToAction = new Map<string, ActionName>();
  private dasTimer = 0;
  private arrTimer = 0;
  private dasCharging: "left" | "right" | null = null;

  constructor(private handlers: InputHandlers) {
    (Object.keys(KEYBINDS) as ActionName[]).forEach((action) => {
      KEYBINDS[action].forEach((code) => this.codeToAction.set(code, action));
    });
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    const action = this.codeToAction.get(e.code);
    if (action) e.preventDefault();
    if (e.repeat) return;
    this.handlers.onAnyKey?.(e);
    if (!action) return;
    this.pressed.add(e.code);

    switch (action) {
      case "moveLeft":
        this.handlers.onMoveLeft?.();
        this.dasCharging = "left";
        this.dasTimer = 0;
        this.arrTimer = 0;
        break;
      case "moveRight":
        this.handlers.onMoveRight?.();
        this.dasCharging = "right";
        this.dasTimer = 0;
        this.arrTimer = 0;
        break;
      case "rotateCW":
        this.handlers.onRotateCW?.();
        break;
      case "rotateCCW":
        this.handlers.onRotateCCW?.();
        break;
      case "hardDrop":
        this.handlers.onHardDrop?.();
        break;
      case "hold":
        this.handlers.onHold?.();
        break;
      case "pause":
        this.handlers.onPause?.();
        break;
      case "restart":
        this.handlers.onRestart?.();
        break;
      case "mute":
        this.handlers.onMute?.();
        break;
      case "softDrop":
        break; // continuous state, read via isSoftDropHeld()
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    const action = this.codeToAction.get(e.code);
    this.pressed.delete(e.code);
    if (!action) return;
    if (action === "moveLeft" || action === "moveRight") {
      if (action === "moveLeft" && this.isActionHeld("moveRight")) {
        this.dasCharging = "right";
        this.dasTimer = 0;
        this.arrTimer = 0;
      } else if (action === "moveRight" && this.isActionHeld("moveLeft")) {
        this.dasCharging = "left";
        this.dasTimer = 0;
        this.arrTimer = 0;
      } else if (
        (action === "moveLeft" && this.dasCharging === "left") ||
        (action === "moveRight" && this.dasCharging === "right")
      ) {
        this.dasCharging = null;
      }
    }
  };

  private isActionHeld(action: ActionName): boolean {
    return KEYBINDS[action].some((c) => this.pressed.has(c));
  }

  isSoftDropHeld(): boolean {
    return this.isActionHeld("softDrop");
  }

  /** Advances DAS/ARR auto-repeat timers. Call once per frame with the frame's delta time. */
  update(dtMs: number): void {
    if (!this.dasCharging) return;
    this.dasTimer += dtMs;
    if (this.dasTimer < DAS_MS) return;
    this.arrTimer += dtMs;
    const arr = Math.max(1, ARR_MS);
    while (this.arrTimer >= arr) {
      this.arrTimer -= arr;
      if (this.dasCharging === "left") this.handlers.onMoveLeft?.();
      else if (this.dasCharging === "right") this.handlers.onMoveRight?.();
    }
  }

  dispose(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  }
}
