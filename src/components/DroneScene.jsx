import { useEffect, useRef } from 'react'
import React from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

export function useDroneProgress() {
  const ref = useRef(0)
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      ref.current = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return ref
}

function easeOut(t) { return 1 - Math.pow(1 - t, 3) }

function buildFallbackDrone() {
  const mat = (c) => new THREE.MeshStandardMaterial({ color: c, metalness: 0.4, roughness: 0.5 })
  const corpus = new THREE.Group()
  const head = new THREE.Group()
  corpus.add(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.3, 8), mat(0x9999aa)))
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.05, 8, 28), mat(0xff2a2a))
  ring.rotation.x = Math.PI / 2; corpus.add(ring)
  const a1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 1.75), mat(0x555566))
  a1.rotation.y = Math.PI / 4; corpus.add(a1)
  const a2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 1.75), mat(0x555566))
  a2.rotation.y = -Math.PI / 4; corpus.add(a2)
  ;[[0.85, 0.85], [-0.85, -0.85], [-0.85, 0.85], [0.85, -0.85]].forEach(([px, pz]) => {
    const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.19, 12), mat(0x444455))
    pod.position.set(px, 0, pz); corpus.add(pod)
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.024, 24),
      new THREE.MeshStandardMaterial({ color: 0x778899, transparent: true, opacity: 0.82 }))
    r.position.set(px, 0.14, pz); corpus.add(r)
  })
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.33, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.57),
    new THREE.MeshStandardMaterial({ color: 0x99ccff, transparent: true, opacity: 0.45, roughness: 0.05 }))
  dome.position.set(0, 0.24, 0); head.add(dome)
  const dr = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.044, 8, 22), mat(0xff2a2a))
  dr.rotation.x = Math.PI / 2; dr.position.set(0, 0.24, 0); head.add(dr)
  head._baseY = 0
  head._baseX = 0
  corpus._baseY = 0
  return { corpus, head }
}

export function DroneScene({ progressRef }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let mounted = true, rafId = null

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    renderer.outputColorSpace = THREE.SRGBColorSpace
    el.appendChild(renderer.domElement)

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200)
    camera.position.set(0, 0.5, 7)
    camera.lookAt(0, 0, 0)

    const scene = new THREE.Scene()
    scene.add(new THREE.AmbientLight(0xffffff, 0.9))
    const kl = new THREE.DirectionalLight(0xffffff, 2.8); kl.position.set(4, 8, 6); scene.add(kl)
    const fl = new THREE.DirectionalLight(0x6688ff, 1.0); fl.position.set(-7, 2, -5); scene.add(fl)
    const rl = new THREE.DirectionalLight(0xff3333, 1.8); rl.position.set(1, -6, -8); scene.add(rl)

    const resize = () => {
      const w = el.clientWidth || window.innerWidth
      const h = el.clientHeight || window.innerHeight
      renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize); ro.observe(el)

    const root = new THREE.Group()
    scene.add(root)

    const fb = buildFallbackDrone()
    root.add(fb.corpus); root.add(fb.head)
    let corpus = fb.corpus
    let head = fb.head
    let corpusScene = null, headScene = null

    // Called when BOTH models are ready  scales them together so relative
    // positions from CAD are preserved, then centers the combined assembly.
    const tryAssemble = () => {
      if (!mounted || !corpusScene || !headScene) return

      // Measure combined bounding box at original scale
      const probe = new THREE.Group()
      probe.add(corpusScene); probe.add(headScene)
      const box = new THREE.Box3().setFromObject(probe)
      const size = new THREE.Vector3(); box.getSize(size)
      const scale = 3.5 / Math.max(size.x, size.y, size.z)
      const center = new THREE.Vector3(); box.getCenter(center)
      // Return children so we can parent them individually
      probe.remove(corpusScene); probe.remove(headScene)

      // Apply same scale + centering offset to both — preserves CAD relative positions
      // Both parts share the same centered assembly origin, so headScene.rotation.y
      // spins the head around the drone's central Y axis = the screw axis
      const SCREW = Math.PI * 0.42  // ~75° unscrew travel
      const cx = center.x * scale, cy = center.y * scale, cz = center.z * scale
      corpusScene.scale.setScalar(scale)
      corpusScene.position.set(-cx, -cy, -cz)
      headScene.scale.setScalar(scale)
      headScene.position.set(-cx + 0.18, -cy, -cz)
      headScene.rotation.y = 0
      headScene._baseY = headScene.position.y
      headScene._baseX = headScene.position.x
      headScene._screwAngle = SCREW

      // Store base Y for animation
      corpusScene._baseY = corpusScene.position.y

      // Swap fallback
      root.remove(corpus); root.remove(head)
      corpus = corpusScene
      head = headScene
      root.add(corpus); root.add(head)
    }

    const loader = new GLTFLoader()
    loader.load('/models/Drohne_Corpus.glb', (gltf) => {
      if (!mounted) return
      corpusScene = gltf.scene
      tryAssemble()
    }, undefined, (e) => console.warn('[DroneScene] corpus:', e))

    loader.load('/models/Drohne_Kopf.glb', (gltf) => {
      if (!mounted) return
      headScene = gltf.scene
      tryAssemble()
    }, undefined, (e) => console.warn('[DroneScene] kopf:', e))

    let frame = 0
    const tick = () => {
      if (!mounted) return
      rafId = requestAnimationFrame(tick)
      frame++
      root.position.y = Math.sin(frame * 0.018) * 0.06

      const p = (progressRef && progressRef.current) || 0
      const baseC = corpus._baseY || 0
      const baseH = head._baseY || 0
      const baseX = head._baseX !== undefined ? head._baseX : 0
      const SCREW = head._screwAngle || 0

      if (p < 0.33) {
        root.rotation.y = (p / 0.33) * Math.PI * 1.6
        corpus.position.y = baseC
        head.position.y = baseH
        head.position.x = baseX
        camera.position.set(0, 0.5, 7)
      } else if (p < 0.66) {
        const t = easeOut((p - 0.33) / 0.33)
        root.rotation.y = Math.PI * 1.6 + t * Math.PI * 0.4
        head.position.x = baseX - t * 3.2
        head.position.y = baseH
        corpus.position.y = baseC - t * 0.4
        camera.position.set(0, 0.5, 7)
      } else {
        const t = easeOut((p - 0.66) / 0.34)
        root.rotation.y = Math.PI * 2.0 + t * Math.PI * 0.6
        head.position.x = baseX - (1 - t) * 3.2
        head.position.y = baseH
        corpus.position.y = baseC - (1 - t) * 0.4
        camera.position.set(0, 0.5, 7)
      }

      camera.lookAt(0, root.position.y * 0.3, 0)
      renderer.render(scene, camera)
    }
    tick()

    return () => {
      mounted = false
      if (rafId) cancelAnimationFrame(rafId)
      ro.disconnect()
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose()
        if (o.material) {
          if (Array.isArray(o.material)) { o.material.forEach((m) => m.dispose()) }
          else { o.material.dispose() }
        }
      })
      renderer.dispose()
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
  }, [])

  return React.createElement('div', { ref: containerRef, style: { width: '100%', height: '100%' } })
}
