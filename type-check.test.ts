/**
 * Type checking validation
 * This file exists to validate that rail.d.ts exports work correctly
 */

import type { RailOptions, EventHandler, UnsubscribeFunction } from './rail.d.ts';
import { Rail } from './rail.js';

// Test basic Rail instantiation
const rail1: Rail = new Rail();
const rail2: Rail = new Rail({ name: 'test', debug: true, clone: false });

// Test options type
const options: RailOptions = { name: 'app', debug: false, clone: true };

// Test event handler type
const handler: EventHandler<{ message: string }> = (data) => {
  console.log(data.message);
};

// Test unsubscribe function type
const unsub: UnsubscribeFunction = rail1.on('test', handler);

// Test method signatures
rail1.emit('test', { message: 'hello' });
rail1.on('test', handler, 'module');
rail1.detach('module');
rail1.getModules();
rail1.getEvents();
rail1.getHistory(5);
rail1.clearHistory();
rail1.setDebug(true);
rail1.setClone(false);
rail1.getStats();

// Test async
async function testAsync() {
  const results = await rail1.emitAsync('test', { data: 123 });
  const data = await rail1.waitFor('event', 1000);
}
