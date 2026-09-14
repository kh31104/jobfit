import {restoreBeforeApp,startContinuity} from './storageContinuity.js?v=1';

await restoreBeforeApp();
await import('./app.js?v=14');
await import('./injeClassroom.js?v=14');
await import('./careerDnaUx.js?v=2');
startContinuity();
