/**
 * Tech-style sphere graph component
 * Canvas-based 3D sphere effect, supports light/dark themes
 */

import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { useSettingsStore } from '@/stores';
import type { GraphNode, GraphEdge } from '../types';

interface SphereGraphProps {
  nodes: GraphNode[];
  links: GraphEdge[];
  width: number;
  height: number;
  onNodeClick?: (node: GraphNode) => void;
  onNodeHover?: (node: GraphNode | null) => void;
  currentPageId?: string;
}

interface SphereNode extends GraphNode {
  x: number;
  y: number;
  z: number;
  screenX: number;
  screenY: number;
  scale: number;
  hasBacklinks: boolean; // Whether has backlinks
}

// Sphere configuration
const SPHERE_CONFIG = {
  radius: 0.38,
  dragSensitivity: 0.008,
  perspective: 600,
  minNodeSize: 6,
  maxNodeSize: 20,
  friction: 0.95, // Inertia friction
  minVelocity: 0.001, // Minimum velocity threshold
};

export function SphereGraph({
  nodes,
  links,
  width,
  height,
  onNodeClick,
  onNodeHover,
  currentPageId,
}: SphereGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const theme = useSettingsStore(state => state.appearance.theme);

  // Rotation state
  const rotationRef = useRef({ x: 0.3, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const projectedNodesRef = useRef<SphereNode[]>([]);

  // Hovered node
  const [hoveredNode, setHoveredNode] = useState<SphereNode | null>(null);

  // Determine if dark theme
  const isDark = useMemo(() => {
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }, [theme]);

  // Calculate set of nodes with backlinks
  const nodesWithBacklinks = useMemo(() => {
    const set = new Set<string>();
    links.forEach(link => {
      set.add(link.target); // target is the linked page, i.e., has backlinks
    });
    return set;
  }, [links]);

  // Theme color configuration
  const colors = useMemo(() => ({
    // Background
    bgColor: isDark ? '#0f0f1a' : '#f8fafc',
    // Node colors
    nodeDefault: isDark ? '#6366f1' : '#4f46e5', // indigo
    nodeCurrent: isDark ? '#ec4899' : '#db2777', // pink - current page
    nodeWithBacklinks: isDark ? '#10b981' : '#059669', // emerald - has backlinks
    nodeOrphan: isDark ? '#4b5563' : '#9ca3af', // gray - orphan node
    // Glow colors
    glowCurrent: isDark ? 'rgba(236, 72, 153, 0.5)' : 'rgba(219, 39, 119, 0.4)',
    glowBacklinks: isDark ? 'rgba(16, 185, 129, 0.5)' : 'rgba(5, 150, 105, 0.4)',
    glowDefault: isDark ? 'rgba(99, 102, 241, 0.4)' : 'rgba(79, 70, 229, 0.3)',
    // Link colors
    linkColor: isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(79, 70, 229, 0.2)',
    linkHighlight: isDark ? 'rgba(99, 102, 241, 0.6)' : 'rgba(79, 70, 229, 0.5)',
    // Text colors
    textColor: isDark ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.85)',
    textShadow: isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
    // Decoration
    ringColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(79, 70, 229, 0.1)',
  }), [isDark]);

  // Distribute nodes on sphere surface
  const sphereNodes = useMemo<SphereNode[]>(() => {
    if (nodes.length === 0) return [];

    // Use Fibonacci sphere distribution algorithm
    const goldenRatio = (1 + Math.sqrt(5)) / 2;

    return nodes.map((node, i) => {
      const theta = 2 * Math.PI * i / goldenRatio;
      const phi = Math.acos(1 - 2 * (i + 0.5) / nodes.length);

      return {
        ...node,
        x: Math.sin(phi) * Math.cos(theta),
        y: Math.sin(phi) * Math.sin(theta),
        z: Math.cos(phi),
        screenX: 0,
        screenY: 0,
        scale: 1,
        isCurrent: node.id === currentPageId,
        hasBacklinks: nodesWithBacklinks.has(node.id),
      };
    });
  }, [nodes, currentPageId, nodesWithBacklinks]);

  // 3D rotation transform
  const rotatePoint = useCallback((x: number, y: number, z: number, rx: number, ry: number) => {
    // Rotate around Y axis
    const x1 = x * Math.cos(ry) - z * Math.sin(ry);
    const z1 = x * Math.sin(ry) + z * Math.cos(ry);
    // Rotate around X axis
    const y1 = y * Math.cos(rx) - z1 * Math.sin(rx);
    const z2 = y * Math.sin(rx) + z1 * Math.cos(rx);
    return { x: x1, y: y1, z: z2 };
  }, []);

  // Project to 2D screen
  const projectToScreen = useCallback((x: number, y: number, z: number, centerX: number, centerY: number, radius: number) => {
    const perspective = SPHERE_CONFIG.perspective;
    const scale = perspective / (perspective + z * radius);
    return {
      screenX: centerX + x * radius * scale,
      screenY: centerY + y * radius * scale,
      scale,
    };
  }, []);

  // Get node size
  const getNodeSize = useCallback((node: SphereNode, maxLinkCount: number) => {
    const linkRatio = maxLinkCount > 0 ? node.linkCount / maxLinkCount : 0;
    return SPHERE_CONFIG.minNodeSize + linkRatio * (SPHERE_CONFIG.maxNodeSize - SPHERE_CONFIG.minNodeSize);
  }, []);

  // Get node colors
  const getNodeColors = useCallback((node: SphereNode) => {
    if (node.isCurrent) {
      return { fill: colors.nodeCurrent, glow: colors.glowCurrent };
    }
    if (node.hasBacklinks && !node.isOrphan) {
      return { fill: colors.nodeWithBacklinks, glow: colors.glowBacklinks };
    }
    if (node.isOrphan) {
      return { fill: colors.nodeOrphan, glow: 'transparent' };
    }
    return { fill: colors.nodeDefault, glow: colors.glowDefault };
  }, [colors]);

  // Draw decoration rings
  const drawRings = useCallback((ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) => {
    ctx.strokeStyle = colors.ringColor;
    ctx.lineWidth = 1;

    // Draw ellipse rings (simulate 3D effect)
    for (let i = 1; i <= 2; i++) {
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radius * (0.6 + i * 0.25), radius * (0.3 + i * 0.1), 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, [colors.ringColor]);

  // Draw links
  const drawLinks = useCallback((
    ctx: CanvasRenderingContext2D,
    projectedNodes: SphereNode[],
    hoveredId: string | null
  ) => {
    const nodeMap = new Map(projectedNodes.map(n => [n.id, n]));

    links.forEach(link => {
      const source = nodeMap.get(link.source);
      const target = nodeMap.get(link.target);
      if (!source || !target) return;

      const isHighlighted = hoveredId && (link.source === hoveredId || link.target === hoveredId);
      const avgScale = (source.scale + target.scale) / 2;

      // Only draw front links (avoid penetration effect)
      if (avgScale < 0.85) return;

      ctx.beginPath();
      ctx.moveTo(source.screenX, source.screenY);
      ctx.lineTo(target.screenX, target.screenY);
      ctx.strokeStyle = isHighlighted ? colors.linkHighlight : colors.linkColor;
      ctx.lineWidth = isHighlighted ? 2.5 : 1.5;
      ctx.stroke();
    });
  }, [links, colors.linkColor, colors.linkHighlight]);

  // Draw node
  const drawNode = useCallback((
    ctx: CanvasRenderingContext2D,
    node: SphereNode,
    isHovered: boolean,
    maxLinkCount: number
  ) => {
    const baseSize = getNodeSize(node, maxLinkCount);
    const size = baseSize * node.scale;
    const { fill, glow } = getNodeColors(node);

    // Glow effect (has backlinks, current page, or hovered)
    if (node.hasBacklinks || node.isCurrent || isHovered) {
      const glowSize = size * (isHovered ? 3.5 : 2.5);
      const gradient = ctx.createRadialGradient(
        node.screenX, node.screenY, 0,
        node.screenX, node.screenY, glowSize
      );
      gradient.addColorStop(0, glow);
      gradient.addColorStop(0.6, glow.replace(/[\d.]+\)$/, '0.1)'));
      gradient.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(node.screenX, node.screenY, glowSize, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Draw node body
    ctx.beginPath();
    ctx.arc(node.screenX, node.screenY, size, 0, Math.PI * 2);

    // Gradient fill (3D effect)
    const nodeGradient = ctx.createRadialGradient(
      node.screenX - size * 0.3, node.screenY - size * 0.3, 0,
      node.screenX, node.screenY, size * 1.2
    );
    nodeGradient.addColorStop(0, isDark ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)');
    nodeGradient.addColorStop(0.4, fill);
    nodeGradient.addColorStop(1, fill);

    ctx.fillStyle = nodeGradient;
    ctx.fill();

    // Hover border
    if (isHovered) {
      ctx.strokeStyle = isDark ? '#ffffff' : '#1f2937';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // Draw label
    const showLabel = node.scale > 0.75 || isHovered || node.isCurrent || node.hasBacklinks;
    if (showLabel) {
      const fontSize = Math.max(11, 13 * node.scale);
      ctx.font = `${isHovered || node.isCurrent ? 'bold ' : ''}${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const label = node.label.length > 12 ? node.label.slice(0, 12) + '...' : node.label;
      const labelY = node.screenY + size + 5;

      // Text stroke (improve readability)
      ctx.strokeStyle = colors.textShadow;
      ctx.lineWidth = 3;
      ctx.strokeText(label, node.screenX, labelY);

      // Main text
      ctx.fillStyle = colors.textColor;
      ctx.fillText(label, node.screenX, labelY);
    }
  }, [getNodeSize, getNodeColors, colors, isDark]);

  // Find hovered node
  const findHoveredNode = useCallback((mouseX: number, mouseY: number): SphereNode | null => {
    const projectedNodes = projectedNodesRef.current;
    // Sort by scale (front to back), prioritize detecting front nodes
    const sortedNodes = [...projectedNodes].sort((a, b) => b.scale - a.scale);
    const maxLinkCount = Math.max(1, ...nodes.map(n => n.linkCount));

    for (const node of sortedNodes) {
      const size = getNodeSize(node, maxLinkCount) * node.scale;
      const hitRadius = size + 10;

      const dx = mouseX - node.screenX;
      const dy = mouseY - node.screenY;

      if (dx * dx + dy * dy < hitRadius * hitRadius) {
        return node;
      }
    }
    return null;
  }, [nodes, getNodeSize]);

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || sphereNodes.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * SPHERE_CONFIG.radius;
    const maxLinkCount = Math.max(1, ...nodes.map(n => n.linkCount));

    const render = () => {
      // Apply inertia
      if (!isDraggingRef.current) {
        rotationRef.current.x += velocityRef.current.x;
        rotationRef.current.y += velocityRef.current.y;

        // Friction deceleration
        velocityRef.current.x *= SPHERE_CONFIG.friction;
        velocityRef.current.y *= SPHERE_CONFIG.friction;

        // Stop when velocity is too small
        if (Math.abs(velocityRef.current.x) < SPHERE_CONFIG.minVelocity) {
          velocityRef.current.x = 0;
        }
        if (Math.abs(velocityRef.current.y) < SPHERE_CONFIG.minVelocity) {
          velocityRef.current.y = 0;
        }
      }

      // Clear canvas
      ctx.fillStyle = colors.bgColor;
      ctx.fillRect(0, 0, width, height);

      // Draw decoration rings
      drawRings(ctx, centerX, centerY, radius);

      // Calculate projection positions for all nodes
      const projectedNodes = sphereNodes.map(node => {
        const rotated = rotatePoint(
          node.x, node.y, node.z,
          rotationRef.current.x,
          rotationRef.current.y
        );
        const projected = projectToScreen(rotated.x, rotated.y, rotated.z, centerX, centerY, radius);

        return {
          ...node,
          screenX: projected.screenX,
          screenY: projected.screenY,
          scale: projected.scale,
        };
      });

      // Save projection results for hover detection
      projectedNodesRef.current = projectedNodes;

      // Sort by z-axis (draw from back to front)
      projectedNodes.sort((a, b) => a.scale - b.scale);

      // Draw links
      drawLinks(ctx, projectedNodes, hoveredNode?.id || null);

      // Draw node
      projectedNodes.forEach(node => {
        drawNode(ctx, node, hoveredNode?.id === node.id, maxLinkCount);
      });

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [width, height, sphereNodes, nodes, colors, hoveredNode, drawRings, drawLinks, drawNode, rotatePoint, projectToScreen]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    velocityRef.current = { x: 0, y: 0 }; // Stop inertia
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDraggingRef.current) {
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;

      rotationRef.current.y += dx * SPHERE_CONFIG.dragSensitivity;
      rotationRef.current.x += dy * SPHERE_CONFIG.dragSensitivity;

      // Record velocity for inertia
      velocityRef.current.x = dy * SPHERE_CONFIG.dragSensitivity;
      velocityRef.current.y = dx * SPHERE_CONFIG.dragSensitivity;

      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    } else {
      // Detect hover
      const hovered = findHoveredNode(mouseX, mouseY);
      if (hovered?.id !== hoveredNode?.id) {
        setHoveredNode(hovered);
        onNodeHover?.(hovered);
      }
    }
  }, [hoveredNode, onNodeHover, findHoveredNode]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isDraggingRef.current = false;
    setHoveredNode(null);
    onNodeHover?.(null);
  }, [onNodeHover]);

  const handleClick = useCallback(() => {
    if (!hoveredNode) return;
    onNodeClick?.(hoveredNode);
  }, [hoveredNode, onNodeClick]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    />
  );
}
