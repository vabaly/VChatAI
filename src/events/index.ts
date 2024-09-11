/**
 * @file 事件监听与触发对象
 */

import { EventEmitter } from "eventemitter3";

export enum EventList {
  StartVad = "StartVad",
  PauseVad = "PauseVad",
}

export const eventBus = new EventEmitter();
