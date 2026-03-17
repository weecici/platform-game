import * as CANNON from 'cannon-es';

/**
 * PhysicsWorld - Wrapper around Cannon-es physics engine
 */
export class PhysicsWorld {
  public world: CANNON.World;

  constructor() {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -20, 0),
    });

    // Broadphase for performance
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);

    // Default contact material
    const defaultMaterial = new CANNON.Material('default');
    const defaultContactMaterial = new CANNON.ContactMaterial(
      defaultMaterial,
      defaultMaterial,
      {
        friction: 0.2,
        restitution: 0.2,
      },
    );
    this.world.addContactMaterial(defaultContactMaterial);
    this.world.defaultContactMaterial = defaultContactMaterial;
  }

  step(dt: number): void {
    // Fixed time step for stability
    this.world.step(1 / 60, dt, 3);
  }

  addBody(body: CANNON.Body): void {
    this.world.addBody(body);
  }

  removeBody(body: CANNON.Body): void {
    this.world.removeBody(body);
  }
}
