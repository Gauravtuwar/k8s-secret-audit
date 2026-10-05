'use client';

import React, { useRef, useEffect } from 'react';

interface Node3D {
  x: number;
  y: number;
  z: number;
  label: string;
  type: 'apiserver' | 'etcd' | 'vault' | 'rbac' | 'workload';
  color: string;
  size: number;
}

export function Security3DNodeCanvas({ score = 85 }: { score?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angleX = 0.005;
    let angleY = 0.008;

    // Nodes in 3D Space
    const nodes: Node3D[] = [
      { x: 0, y: 0, z: 0, label: 'K8s API Server', type: 'apiserver', color: '#06b6d4', size: 14 },
      { x: -90, y: -45, z: 60, label: 'etcd Encryption', type: 'etcd', color: score < 75 ? '#ef4444' : '#10b981', size: 11 },
      { x: 90, y: 45, z: -60, label: 'Secret Vault', type: 'vault', color: '#3b82f6', size: 10 },
      { x: 60, y: -80, z: 40, label: 'RBAC Controller', type: 'rbac', color: '#f59e0b', size: 10 },
      { x: -75, y: 75, z: -30, label: 'Kubelet Nodes', type: 'workload', color: '#8b5cf6', size: 9 },
      { x: 110, y: -30, z: 80, label: 'KMS v2 Engine', type: 'etcd', color: '#06b6d4', size: 9 },
      { x: -100, y: -90, z: -50, label: 'Pod Mounts', type: 'workload', color: '#64748b', size: 7 }
    ];

    // Connectivity Links between nodes
    const links = [
      [0, 1], [0, 2], [0, 3], [0, 4], [1, 5], [2, 6], [3, 4]
    ];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
    };
    resize();
    window.addEventListener('resize', resize);

    let rotationX = 0;
    let rotationY = 0;

    const render = () => {
      ctx.save();
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);

      rotationX += angleX;
      rotationY += angleY;

      // Project 3D points
      const projected = nodes.map((node) => {
        // Rotate around Y
        let x1 = node.x * Math.cos(rotationY) - node.z * Math.sin(rotationY);
        let z1 = node.x * Math.sin(rotationY) + node.z * Math.cos(rotationY);

        // Rotate around X
        let y2 = node.y * Math.cos(rotationX) - z1 * Math.sin(rotationX);
        let z2 = node.y * Math.sin(rotationX) + z1 * Math.cos(rotationX);

        // Perspective projection
        const fov = 300;
        const scale = fov / (fov + z2);
        const px = cx + x1 * scale;
        const py = cy + y2 * scale;

        return { px, py, scale, z: z2, node };
      });

      // Sort by Z for proper rendering depth
      projected.sort((a, b) => b.z - a.z);

      // Draw Connection Lines
      links.forEach(([i, j]) => {
        const p1 = projected.find(p => p.node === nodes[i]);
        const p2 = projected.find(p => p.node === nodes[j]);

        if (p1 && p2) {
          ctx.beginPath();
          ctx.moveTo(p1.px, p1.py);
          ctx.lineTo(p2.px, p2.py);
          const gradient = ctx.createLinearGradient(p1.px, p1.py, p2.px, p2.py);
          gradient.addColorStop(0, p1.node.color + '44');
          gradient.addColorStop(1, p2.node.color + '44');
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Animated particle on connection
          const time = (Date.now() * 0.001) % 1;
          const particleX = p1.px + (p2.px - p1.px) * time;
          const particleY = p1.py + (p2.py - p1.py) * time;
          ctx.beginPath();
          ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff88';
          ctx.fill();
        }
      });

      // Draw 3D Nodes & Halo Glows
      projected.forEach(({ px, py, scale, node }) => {
        const r = node.size * scale;

        // Outer Glow Halo
        const glow = ctx.createRadialGradient(px, py, 0, px, py, r * 2.5);
        glow.addColorStop(0, node.color + '66');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px, py, r * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Node Circle Body
        ctx.beginPath();
        ctx.arc(px, py, Math.max(r, 3), 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Node Label
        if (scale > 0.8) {
          ctx.fillStyle = '#f8fafc';
          ctx.font = `${Math.floor(10 * scale)}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(node.label, px, py + r + 12);
        }
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [score]);

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-xl border border-cyan-500/20 bg-slate-950/70 p-4 shadow-2xl backdrop-blur-md">
      <div className="absolute left-4 top-4 z-10 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
        <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
        3D Cluster Topology & Encryption Mesh
      </div>
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
