import * as THREE from "three";
import { SceneGeometry } from "../../scene-geometry/scene-geometry";

export default class Plane extends SceneGeometry {
    constructor() {
        super('Plane', new THREE.PlaneGeometry(1, 1), new THREE.LineBasicMaterial({ color: 0xaa0000, transparent: true, opacity: 0.5, depthTest: true, depthWrite: false, side: THREE.DoubleSide }))
    }

    protected setInnerModule(): void {
    }

}