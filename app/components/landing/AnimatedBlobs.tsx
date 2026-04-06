"use client";

import { useEffect, useRef } from "react";

const VERTEX_SHADER = `void main() { gl_Position = vec4(position, 1.0); }`;

const FRAGMENT_SHADER = `
  uniform float iTime;
  uniform vec3 iResolution;
  uniform float iScrollProgress;
  uniform float iMergeAmount;
  uniform float iColorShift;
  uniform vec3 iBallPositions[8];

  vec3 hash(vec3 p) {
    p = vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6)));
    return -1.0 + 2.0*fract(sin(p)*43758.5453123);
  }

  float noise(in vec3 p) {
    vec3 i=floor(p); vec3 f=fract(p); vec3 u=f*f*(3.0-2.0*f);
    return mix(mix(mix(dot(hash(i+vec3(0,0,0)),f-vec3(0,0,0)),dot(hash(i+vec3(1,0,0)),f-vec3(1,0,0)),u.x),
                   mix(dot(hash(i+vec3(0,1,0)),f-vec3(0,1,0)),dot(hash(i+vec3(1,1,0)),f-vec3(1,1,0)),u.x),u.y),
               mix(mix(dot(hash(i+vec3(0,0,1)),f-vec3(0,0,1)),dot(hash(i+vec3(1,0,1)),f-vec3(1,0,1)),u.x),
                   mix(dot(hash(i+vec3(0,1,1)),f-vec3(0,1,1)),dot(hash(i+vec3(1,1,1)),f-vec3(1,1,1)),u.x),u.y),u.z);
  }

  void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec3 dir = normalize(vec3((2.0*fragCoord.xy-iResolution.xy)/min(iResolution.x,iResolution.y),1.7));
    vec3 p = vec3(0,0,-7);
    vec3 gradient,q,a;
    float dist,b;

    for(int i=0;i<100;i++) {
      q=p; p+=dir*dist; gradient=vec3(0); dist=0.0;
      for(int j=0;j<8;j++) {
        vec3 ballp=iBallPositions[j];
        ballp.x+=sin(iTime*0.3+float(j)*0.5+iScrollProgress*3.0)*(3.0-iMergeAmount*2.5);
        ballp.y+=cos(iTime*0.2+float(j)*0.7+iScrollProgress*2.0)*(3.0-iMergeAmount*2.5);
        ballp.z+=sin(iTime*0.4+float(j)*0.3+iScrollProgress*4.0)*(3.0-iMergeAmount*2.5);
        ballp=mix(ballp,vec3(0.0),iMergeAmount);
        b=dot(a=p-ballp,a);
        float strength=1.0+iMergeAmount*2.0;
        gradient+=a/(b*b)*strength;
        dist+=strength/b;
      }
      dist=1.0-dist;
      if(dist<0.001){dir=reflect(dir,normalize(gradient));p=q;dist=0.0;}
    }

    vec3 col=dir*0.5+0.5;
    float noiseVal=noise(col*2.0+iTime*0.3+iScrollProgress);
    vec3 finalColor=col*2.0*noiseVal;

    float r = finalColor.r * 1.6 + finalColor.g * 0.4;
    float g = finalColor.r * 0.5 + finalColor.g * 0.3;
    float b2 = finalColor.b * 0.15;
    finalColor = vec3(r, g, b2);

    finalColor = mix(
      finalColor,
      vec3(finalColor.r * 1.1, finalColor.g * 0.4, finalColor.b * 0.1),
      iColorShift * 0.6
    );

    finalColor = clamp(finalColor, 0.0, 1.0);
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export default function AnimatedBlobs() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const materialRef = useRef<any>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId: number;
    let cleanup: (() => void) | null = null;

    async function init() {
      const THREE = await import("three");
      const gsapModule = await import("gsap");
      const scrollModule = await import("gsap/ScrollTrigger");

      const gsap = gsapModule.gsap;
      const ScrollTrigger = scrollModule.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);

      const renderer = new THREE.WebGLRenderer({ canvas: canvas!, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      const shaderMaterial = new THREE.ShaderMaterial({
        uniforms: {
          iTime: { value: 0 },
          iResolution: { value: new THREE.Vector3(window.innerWidth, window.innerHeight, 1) },
          iScrollProgress: { value: 0 },
          iMergeAmount: { value: 0 },
          iColorShift: { value: 0 },
          iBallPositions: {
            value: [
              new THREE.Vector3(-3, 2, 0),
              new THREE.Vector3(3, -2, 1),
              new THREE.Vector3(-2, -3, 2),
              new THREE.Vector3(2, 3, -1),
              new THREE.Vector3(0, 0, 3),
              new THREE.Vector3(-1, 1, -2),
              new THREE.Vector3(1, -1, -3),
              new THREE.Vector3(0, 0, 0),
            ],
          },
        },
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
      });

      materialRef.current = shaderMaterial;

      const geometry = new THREE.PlaneGeometry(2, 2);
      scene.add(new THREE.Mesh(geometry, shaderMaterial));

      function onResize() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        shaderMaterial.uniforms.iResolution.value.set(window.innerWidth, window.innerHeight, 1);
      }
      window.addEventListener("resize", onResize);

      // GSAP scroll animations — targets the scrollable content
      const contentEl = document.querySelector("[data-scroll-content]");
      if (contentEl) {
        gsap.to(shaderMaterial.uniforms.iScrollProgress, {
          value: 1, ease: "none",
          scrollTrigger: { trigger: contentEl, start: "top top", end: "bottom bottom", scrub: true },
        });

        gsap.timeline({
          scrollTrigger: { trigger: contentEl, start: "33% top", end: "66% bottom", scrub: true },
        })
          .to(shaderMaterial.uniforms.iMergeAmount, { value: 1, duration: 1, ease: "power2.inOut" })
          .to(shaderMaterial.uniforms.iMergeAmount, { value: 0, duration: 1, ease: "power2.inOut" });

        gsap.timeline({
          scrollTrigger: { trigger: contentEl, start: "50% top", end: "bottom bottom", scrub: true },
        })
          .to(shaderMaterial.uniforms.iColorShift, { value: 1, duration: 1, ease: "sine.inOut" })
          .to(shaderMaterial.uniforms.iColorShift, { value: 0, duration: 1, ease: "sine.inOut" });
      }

      function animate(time: number) {
        shaderMaterial.uniforms.iTime.value = time * 0.001;
        renderer.render(scene, camera);
        animId = requestAnimationFrame(animate);
      }
      animId = requestAnimationFrame(animate);

      cleanup = () => {
        window.removeEventListener("resize", onResize);
        cancelAnimationFrame(animId);
        renderer.dispose();
        geometry.dispose();
        shaderMaterial.dispose();
        ScrollTrigger.getAll().forEach((t: any) => t.kill());
      };
    }

    init();

    return () => { cleanup?.(); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
      }}
    />
  );
}
