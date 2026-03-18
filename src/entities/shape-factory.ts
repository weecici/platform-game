import * as THREE from 'three';

/**
 * ShapeFactory - Creates all basic 3D primitive shapes
 * Covers: Box, Sphere, Cone, Cylinder, Wheel (Torus), Teapot, and more
 */
export class ShapeFactory {
  /**
   * Create a box (Hinh hop)
   */
  static createBox(
    width = 1,
    height = 1,
    depth = 1,
    material?: THREE.Material,
  ): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const mat =
      material ||
      new THREE.MeshStandardMaterial({
        color: 0x8844aa,
        roughness: 0.4,
        metalness: 0.3,
      });
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  /**
   * Create a sphere (Hinh cau)
   */
  static createSphere(
    radius = 0.5,
    widthSegments = 32,
    heightSegments = 32,
    material?: THREE.Material,
  ): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(
      radius,
      widthSegments,
      heightSegments,
    );
    const mat =
      material ||
      new THREE.MeshStandardMaterial({
        color: 0x44aa88,
        roughness: 0.3,
        metalness: 0.5,
      });
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  /**
   * Create a cone (Hinh non)
   */
  static createCone(
    radius = 0.5,
    height = 1,
    radialSegments = 32,
    material?: THREE.Material,
  ): THREE.Mesh {
    const geometry = new THREE.ConeGeometry(radius, height, radialSegments);
    const mat =
      material ||
      new THREE.MeshStandardMaterial({
        color: 0xaa4488,
        roughness: 0.4,
        metalness: 0.2,
      });
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  /**
   * Create a cylinder (Hinh tru)
   */
  static createCylinder(
    radiusTop = 0.5,
    radiusBottom = 0.5,
    height = 1,
    radialSegments = 32,
    material?: THREE.Material,
  ): THREE.Mesh {
    const geometry = new THREE.CylinderGeometry(
      radiusTop,
      radiusBottom,
      height,
      radialSegments,
    );
    const mat =
      material ||
      new THREE.MeshStandardMaterial({
        color: 0x4488aa,
        roughness: 0.3,
        metalness: 0.4,
      });
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  /**
   * Create a wheel / torus (Banh xe)
   */
  static createWheel(
    radius = 0.5,
    tube = 0.15,
    radialSegments = 16,
    tubularSegments = 48,
    material?: THREE.Material,
  ): THREE.Mesh {
    const geometry = new THREE.TorusGeometry(
      radius,
      tube,
      radialSegments,
      tubularSegments,
    );
    const mat =
      material ||
      new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.8,
        metalness: 0.2,
      });
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  /**
   * Create a teapot (Am tra) - approximated using lathe geometry
   * Since Three.js doesn't have a built-in teapot, we create one using
   * a lathe-based profile that resembles a teapot body
   */
  static createTeapot(scale = 1, material?: THREE.Material): THREE.Group {
    const group = new THREE.Group();

    const mat =
      material ||
      new THREE.MeshStandardMaterial({
        color: 0xcc8844,
        roughness: 0.3,
        metalness: 0.6,
      });

    // Body - using lathe geometry with a teapot-like profile
    const bodyPoints: THREE.Vector2[] = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const y = t * 1.2 - 0.4;
      // Teapot body profile curve
      let r: number;
      if (t < 0.1) {
        r = 0.3 + t * 2; // bottom
      } else if (t < 0.5) {
        r = 0.5 + Math.sin((t - 0.1) * Math.PI * 1.25) * 0.2; // belly
      } else if (t < 0.8) {
        r = 0.5 - (t - 0.5) * 0.6; // taper up
      } else {
        r = 0.32 - (t - 0.8) * 0.5; // neck
      }
      bodyPoints.push(new THREE.Vector2(Math.max(r * scale, 0.01), y * scale));
    }
    const bodyGeom = new THREE.LatheGeometry(bodyPoints, 32);
    const body = new THREE.Mesh(bodyGeom, mat);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Lid
    const lidGeom = new THREE.SphereGeometry(
      0.35 * scale,
      16,
      8,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2,
    );
    const lid = new THREE.Mesh(lidGeom, mat);
    lid.position.y = 0.75 * scale;
    lid.castShadow = true;
    group.add(lid);

    // Lid knob
    const knobGeom = new THREE.SphereGeometry(0.06 * scale, 8, 8);
    const knob = new THREE.Mesh(knobGeom, mat);
    knob.position.y = 0.92 * scale;
    group.add(knob);

    // Spout - using a curved cylinder
    const spoutGeom = new THREE.CylinderGeometry(
      0.05 * scale,
      0.08 * scale,
      0.5 * scale,
      8,
    );
    const spout = new THREE.Mesh(spoutGeom, mat);
    spout.position.set(0.55 * scale, 0.35 * scale, 0);
    spout.rotation.z = -Math.PI / 4;
    spout.castShadow = true;
    group.add(spout);

    // Handle - using a torus segment
    const handleGeom = new THREE.TorusGeometry(
      0.25 * scale,
      0.04 * scale,
      8,
      16,
      Math.PI,
    );
    const handle = new THREE.Mesh(handleGeom, mat);
    handle.position.set(-0.55 * scale, 0.35 * scale, 0);
    handle.rotation.y = Math.PI / 2;
    handle.castShadow = true;
    group.add(handle);

    return group;
  }

  /**
   * Create a torus knot (additional shape)
   */
  static createTorusKnot(
    radius = 0.4,
    tube = 0.12,
    material?: THREE.Material,
  ): THREE.Mesh {
    const geometry = new THREE.TorusKnotGeometry(radius, tube, 100, 16);
    const mat =
      material ||
      new THREE.MeshStandardMaterial({
        color: 0xff6644,
        roughness: 0.2,
        metalness: 0.7,
      });
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  /**
   * Create a dodecahedron (additional shape)
   */
  static createDodecahedron(
    radius = 0.5,
    material?: THREE.Material,
  ): THREE.Mesh {
    const geometry = new THREE.DodecahedronGeometry(radius);
    const mat =
      material ||
      new THREE.MeshStandardMaterial({
        color: 0x44ccaa,
        roughness: 0.3,
        metalness: 0.5,
      });
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  /**
   * Create an icosahedron (additional shape)
   */
  static createIcosahedron(
    radius = 0.5,
    material?: THREE.Material,
  ): THREE.Mesh {
    const geometry = new THREE.IcosahedronGeometry(radius);
    const mat =
      material ||
      new THREE.MeshStandardMaterial({
        color: 0xaacc44,
        roughness: 0.3,
        metalness: 0.4,
      });
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }
}
