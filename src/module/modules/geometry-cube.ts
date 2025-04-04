import * as THREE from "three";
import { SceneGeometry } from "../../scene-geometry/scene-geometry";

export default class Cube extends SceneGeometry {
    constructor() {
        super('Cube', new THREE.BoxGeometry( 0.5, 0.5, 0.5 ), new THREE.LineBasicMaterial( { color: 0xaa0000, transparent: true, opacity: 0.5 , depthTest: true, depthWrite: false, side: THREE.BackSide} ))   
    }

    protected setInnerModule(): void {
    }
    
}