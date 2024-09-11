import { type VRMExpressionManager } from "@pixiv/three-vrm";
import { BLINK_CLOSE_MAX, BLINK_OPEN_MAX } from "./emoteConstants";

/**
 * Control of automatic blinking
 */
export class AutoBlink {
  private _expressionManager: VRMExpressionManager;
  private _remainingTime: number;
  private _isOpen: boolean;
  private _isAutoBlink: boolean;

  constructor(expressionManager: VRMExpressionManager) {
    this._expressionManager = expressionManager;
    this._remainingTime = 0;
    this._isAutoBlink = true;
    // Default eyes are open.
    this._isOpen = true;
  }

  /**
   * Turn on/off auto blink.
   *
   * It would be unnatural to express the emotion when the eyes are closed,
   * so return the number of seconds before the eyes open and wait that amount of time before applying the expression.
   * @param isAuto
   * @returns Until the second the eyes open
   */
  public setEnable(isAuto: boolean) {
    this._isAutoBlink = isAuto;

    // If the eyes are closed, return to the time the eyes were open
    if (!this._isOpen) {
      return this._remainingTime;
    }

    // If your eyes are open, you don't have to wait.
    return 0;
  }

  // Each frame takes the waiting time and subtracts the time elapsed for that frame.
  public update(delta: number) {
    if (this._remainingTime > 0) {
      this._remainingTime -= delta;
      return;
    }

    if (this._isOpen && this._isAutoBlink) {
      this.close();
      return;
    }

    this.open();
  }

  // Close one's eyes
  private close(): void {
    this._isOpen = false;
    this._remainingTime = BLINK_CLOSE_MAX;
    this._expressionManager.setValue("blink", 1);
  }

  // Open one's eyes
  private open() {
    this._isOpen = true;
    this._remainingTime = BLINK_OPEN_MAX;
    this._expressionManager.setValue("blink", 0);
  }
}
