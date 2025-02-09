"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useGrid } from "@/app/context/gridContext"; // Adjust the path as needed

const TestSceneWithGLB = () => {

    const { grid } = useGrid(); // Get the grid from the context

    const treeGrid = grid.map(row => row.map(mid => mid ? mid.stage : 0));   
    
    console.log(treeGrid);
    console.log(grid);

      
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize scene, camera, and renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Set background color to sky blue

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current!.appendChild(renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 15); // Soft white light
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffaaaa, 200);
    pointLight.position.set(1, 8, 1);
    scene.add(pointLight);

    // Adjust camera position
    camera.position.set(2.2, 7., 2.2);
    camera.lookAt(0, 5, 0);

    // Add a cube above the model
    // const cubeGeometry = new THREE.BoxGeometry(1.75, 1, 1.75);
    // const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    // const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    // cube.position.set(0, 5.5, 0); // Position the cube above the model
    // scene.add(cube);

    // Load a GLB file
    const loader = new GLTFLoader();
    let model: THREE.Object3D | null = null; // Reference to the loaded model
    loader.load(
      "/models/island.glb", // Replace with the path to your .glb file
      (gltf) => {
        model = gltf.scene;
        model.position.y = 3;
        model.position.z = -0.2; // Adjust the position of the model
        model.scale.set(2, 1, 2); // Adjust the scale of the model
        scene.add(model);

        console.log("GLB Loaded Successfully", gltf);
      },
      (xhr) => {
        console.log(`GLB Loading: ${(xhr.loaded / xhr.total) * 100}% loaded`);
      },
      (error) => {
        console.error("An error occurred while loading the GLB model:", error);
      }
    );
    const treeModels = new Array(treeGrid.length).fill(null).map(() => new Array(treeGrid[0].length).fill(null));
    for (let r = 0; r < treeGrid.length; r++) {
        for (let c = 0; c < treeGrid[r].length; c++) {
            if (treeGrid[r][c] === 0) {
                continue;
            } else {
                let model: THREE.Object3D | null = null; // Reference to the loaded model
                loader.load(
                `/models/${grid[r][c]?.specimen}-${treeGrid[r][c]}.glb`, // Replace with the path to your .glb file
                (gltf) => {
                    treeModels[r][c] = gltf.scene;
                    treeModels[r][c].position.y = 5;
                    treeModels[r][c].position.z = (r - 2) * .35; // Adjust the position of the model
                    treeModels[r][c].position.x = (c - 2) * .35; // Adjust the position of the model

                    const scalar = 0.02 / (treeGrid[r][c] ** 0.5);
                    treeModels[r][c].scale.set(scalar,scalar,scalar); // Adjust the scale of the model
                    scene.add(treeModels[r][c]);

                    console.log("GLB Loaded Successfully", gltf);
                },
                (xhr) => {
                    console.log(`GLB Loading: ${(xhr.loaded / xhr.total) * 100}% loaded`);
                },
                (error) => {
                    console.error("An error occurred while loading the GLB model:", error);
                }
                );
            }
        }
    }

    // Animation loop
    let clock = new THREE.Clock(); // Used to calculate elapsed time for smooth animation
    const animate = () => {
      requestAnimationFrame(animate);

      // Make the model float up and down
      if (model) {
        const elapsedTime = clock.getElapsedTime(); // Time in seconds
        model.position.y = 3.5 + Math.sin(elapsedTime * 2) * 0.03; // Adjust the amplitude and speed
        // cube.position.y = 4.1 + Math.sin(elapsedTime * 2) * 0.03; // Make the cube float too
        for (let r = 0; r < treeGrid.length; r++) {
            for (let c = 0; c < treeGrid[r].length; c++) {
                if (treeGrid[r][c] === 0) {
                    continue;
                } else {
                    treeModels[r][c].position.y = 4.4 + Math.sin(elapsedTime * 2) * 0.03; // Adjust the amplitude and speed
                }
            }
        }
      }

      // Render the scene
      renderer.render(scene, camera);
    };
    animate();

    // Handle resizing
    // const handleResize = () => {
    //   camera.aspect = window.innerWidth / window.innerHeight;
    //   camera.updateProjectionMatrix();
    //   renderer.setSize(window.innerWidth, window.innerHeight);
    // };
    // window.addEventListener("resize", handleResize);

    // // Cleanup
    // return () => {
    //   window.removeEventListener("resize", handleResize);
    //   renderer.dispose();
    //   mountRef.current!.removeChild(renderer.domElement);
    // };
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
};

export default TestSceneWithGLB;
